import { CompletionItem, CompletionItemKind } from 'vscode-languageserver'
import * as Eventsource from 'eventsource'
import * as request from 'request'
import { Item } from './Item'
import * as _ from 'lodash'

export class ItemCompletionProvider {
    private items: Map<string, CompletionItem>
    private es

    private status

    private host
    private port

    constructor() { }

    private getItemsFromRestApi = (host, port, cb) => {
        this.host = host
        this.port = port
        request(`http://${host}:${port}/rest/items/`, { json: true }, (err, res, items) => {
            if (err) { return cb(err); }

            if (Array.isArray(items)) {
                items.map((item: Item) => {
                    this.items.set(item.name, {
                        label: item.name,
                        kind: CompletionItemKind.Variable,
                        detail: item.type,
                        documentation: this.getDocumentation(item)
                    })
                })

                cb()
            }

            cb(new Error('Items is not a valid items array'))
        });
    }

    /**
     * Restarts item completion if host/port changed
     * @param host REST API host
     * @param port 
     */
    public restartIfConfigChanged(host: string, port: number) {
        if (host !== this.host || port != this.port) {
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

        switch (event.type) {
            case 'ItemStateEvent':
                // TODO update item.documentation so that we always have latest values
                break;
            case 'ItemAddedEvent':
                const item = <Item>event.payload
                this.items.set(item.name, {
                    label: item.name,
                    kind: CompletionItemKind.Variable,
                    detail: item.type,
                    documentation: this.getDocumentation(item)
                })
                // TODO sort as the order changes when adding/removing items and REST gives them out in alphabetical order
                break;
            case 'ItemRemovedEvent':
                this.items.delete(itemName)
                break;
            default:
                break;
        }
    }

    public get completionItems(): CompletionItem[] {
        return Array.from(this.items.values())
    }

    public get isRunning(): boolean {
        return this.es.CONNECTING || this.es.OPEN || this.status === 'connecting'
    }

    /**
     * Generates a documentation string for the IntelliSense auto-completion
     * Contains Item's label, state, tags and group names.
     * @param item openHAB Item
     */
    private getDocumentation(item: Item): string {
        let label = item.label ? item.label + ' ' : ''
        let state = item.state ? '(' + item.state + ')' : ''
        let tags = item.tags.length && 'Tags: ' + item.tags.join(', ')
        let groupNames = item.groupNames.length && 'Groups: ' + item.groupNames.join(', ')
        let documentation: string[] = [
            label + state,
            tags,
            groupNames
        ]

        return _.compact(documentation).join('\n')
    }
}
