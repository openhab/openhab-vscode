import { CompletionItem, CompletionItemKind } from 'vscode-languageserver'
import * as Eventsource from 'eventsource'
import * as request from 'request'
import { Item } from './Item'
import * as _ from 'lodash'

/**
 * Provides completion items from REST API from openhab instance.
 * 
 * Currently only works with http. 
 * Example host: http://openhab:8080/rest/items
 * 
 * Completion items are cached and updated with SSE
 * http://openhab:8080/rest/events
 * 
 * @author Samuel Brucksch
 * 
 */
export class ItemCompletionProvider {
    private items: Map<string, Item>
    private es

    private status: string

    private host: string
    private port: number

    constructor() { }

    private getItemsFromRestApi = (host: string, port: number, cb) => {
        this.host = host
        this.port = port
        request(`http://${host}:${port}/rest/items/`, { json: true }, (err, res, items) => {
            if (err) {
                return cb(err)
            }

            if (Array.isArray(items)) {
                items.map((item: Item) => {
                    this.items.set(item.name, item)
                })

                return cb()
            }

            cb(new Error('Items is not a valid items array'))
        });
    }

    /**
     * Restarts item completion if host/port changed
     * 
     * @param host REST API host
     * @param port Port to access REST API
     */
    public restartIfConfigChanged(host: string, port: number) {
        if (host !== this.host || port !== this.port) {
            this.stop()
            this.start(host, port)
        }
    }

    /**
     * Start item completion
     *
     * @param host REST API host
     * @param port Port to access REST API
     */
    public start = (host: string, port: number) => {
        this.items = new Map()
        this.status = 'connecting'
        this.getItemsFromRestApi(host, port, (err) => {
            if (err) {
                // TODO diagnostics that rest api is not reachable?
                console.log(err)
                this.status = 'stopped'
            }

            if (this.status !== 'stopped') {
                this.es = new Eventsource(`http://${host}:${port}/rest/events?topics=smarthome/items`)
                this.es.addEventListener('message', this.event);
            }
        })
    }

    public stop = () => {
        if (this.es) {
            this.es.close()
        }
        this.status = 'stopped'
        this.items = undefined
    }

    private event = (eventPayload) => {
        const event = JSON.parse(eventPayload.data);
        event.payload = JSON.parse(event.payload)
        const itemName = event.topic.split('/')[2]

        let item
        switch (event.type) {
            case 'ItemStateEvent':
                // called when openhab reaceives an item state. There is also ItemStateChangedEvent, that only notifies you about changes
                // however the ItemStateChangedEvent is more or less the same as the ItemStateEvent for the change so we do not need to read both
                item = this.items.get(itemName)
                if (item) {
                    // add new values to item
                    item.state = event.payload.value
                    item.type = event.payload.type
                    this.items.set(itemName, item)
                }
                break;
            case 'ItemUpdatedEvent':
                // update events use an array with 2 elements: array[0] = new, array[1] = old
                // we do not need to compare old and new name as renaming items causes a remove and added event
                // all changes are already in array[0] so we can just overwrite the old item with the new one
                item = <Item>event.payload[0]
                this.items.set(item.name, item)
                break;
            case 'ItemAddedEvent':
                item = <Item>event.payload
                this.items.set(item.name, item)
                // TODO sort as the order changes when adding/removing items
                // REST gives us a sorted list, but when we append with new items, they are not sorted anymore
                break;
            case 'ItemRemovedEvent':
                item = <Item>event.payload
                this.items.delete(item.name)
                break;
            default:
                break;
        }
    }

    /**
     * Returns an array of CompletionItems
     */
    public get completionItems(): CompletionItem[] {
        return Array.from(this.items.values()).map((item: Item) => {
            return {
                label: item.name,
                kind: CompletionItemKind.Variable,
                detail: item.type,
                documentation: this.getDocumentation(item)
            }
        })
    }

    /**
     * Indicates if ItemCompletionProvider is already running
     */
    public get isRunning(): boolean {
        // TODO check again if this is correct
        return this.es.CONNECTING || this.es.OPEN || this.status === 'connecting'
    }

    /**
     * Generates a documentation string for the IntelliSense auto-completion
     * Contains Item's label, state, tags and group names.
     * @param item openHAB Item
     */
    private getDocumentation(item: Item): string {
        const label = item.label ? item.label + ' ' : ''
        const state = item.state ? '(' + item.state + ')' : ''
        const tags = item.tags.length && 'Tags: ' + item.tags.join(', ')
        const groupNames = item.groupNames.length && 'Groups: ' + item.groupNames.join(', ')
        const documentation: string[] = [
            label + state,
            tags,
            groupNames
        ]

        return _.compact(documentation).join('\n')
    }
}
