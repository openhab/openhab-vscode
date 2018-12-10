import { CompletionItem, CompletionItemKind } from 'vscode-languageserver'
import * as Eventsource from 'eventsource'
import * as request from 'request'
import { Item } from './Item'
import * as _ from 'lodash'

export class ItemCompletion {
    private items: Map<string, CompletionItem> = new Map()

    constructor(private host: string, private port: number = 8080) { }

    public getItemsFromRestApi = (cb) => {
        request(`http://${this.host}:${this.port}/rest/items/`, { json: true }, (err, res, items) => {
            if (err) { return console.log(err); }

            items.map((item:Item) => {
                this.items.set(item.name, {
                    label: item.name,
                    kind: CompletionItemKind.Variable,
                    detail: item.type,
                    documentation: this.getDocumentation(item)
                })
            })

            cb()
          });
    }

    public start = () => {
        this.getItemsFromRestApi(() => {
            const es = new Eventsource(`http://${this.host}:${this.port}/rest/events?topics=smarthome/items`)
            es.addEventListener('message', this.event);
        })
    }

    public event = (eventPayload) => {
        const event = JSON.parse(eventPayload.data);
        event.payload = JSON.parse(event.payload)
        const itemName = event.topic.split('/')[2]

        switch (event.type) {
            case 'ItemStateEvent':
                // TODO update item.documentation so that we always have latest values
                break;
            case 'ItemAddedEvent':
                const i = new Item(event.payload)
                this.items.set(i.name, {
                    label: i.name,
                    kind: CompletionItemKind.Variable,
                    detail: i.type,
                    documentation: this.getDocumentation(i)
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
