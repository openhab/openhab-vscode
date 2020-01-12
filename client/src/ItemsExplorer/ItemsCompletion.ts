import {
    CancellationToken,
    CompletionItem,
    CompletionItemKind,
    CompletionItemProvider,
    Position,
    TextDocument,
    workspace
} from 'vscode'

import { Item } from './Item'
import { ItemsModel } from './ItemsModel'
import { getHost } from './../Utils'
import * as _ from 'lodash'

/**
 * Produces a list of openHAB items completions
 * collected from REST API
 *
 * @author Kuba Wolanin - Initial contribution
 */
export class ItemsCompletion implements CompletionItemProvider {

    constructor() {
        if (!this.model) {
            this.model = new ItemsModel(getHost())
        }
    }

    private model: ItemsModel

    public provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken): Thenable<CompletionItem[]> {
        return new Promise((resolve, reject) => {
            let config = workspace.getConfiguration('openhab')

            if (config.connection.useRestApi) {
                this.model.completions.then(completions => {
                    resolve(completions.map((item: Item) => {
                        let completionItem = _.assign(new CompletionItem(item.name), {
                            kind: CompletionItemKind.Variable,
                            detail: item.type,
                            documentation: this.getDocumentation(item)
                        })

                        return completionItem
                    }))
                })
            } else {
                reject()
            }
        })
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
