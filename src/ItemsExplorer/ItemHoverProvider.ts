'use strict';

import {
    HoverProvider,
    Hover,
    MarkedString,
    TextDocument,
    CancellationToken,
    Position,
    workspace,
    languages
} from 'vscode'

import { Item } from './Item'
import { ItemsModel } from './ItemsModel'
import { getHost } from './../Utils'
import * as _ from 'lodash'

export class ItemHoverProvider implements HoverProvider {

    constructor() {
        if (!this.model) {
            this.model = new ItemsModel(getHost())
        }
    }

    private model: ItemsModel

    public async provideHover(document: TextDocument, position: Position, token: CancellationToken): Promise<Hover> {
        let config = workspace.getConfiguration('openhab')

        // if (config.useRestApi) {
        //     this.model.completions.then(completions => {
        //         Promise.resolve(completions.map((item: Item) => {

        //             return item
        //         }))
        //     })
        // } else {
        //     Promise.reject({})
        // }

/**
 * s.split(/(\s+)/).filter(i => i.trim() !== '')
 */

        let isProperFile = ['items', 'persist', 'rules'].includes(document.fileName.split('.')[1])
        let wordRange = document.getWordRangeAtPosition(position)
        let lineRange = document.lineAt(position)
        let linePieces = lineRange.text.split(' ')
        let uid = _.first(_.filter(linePieces, (piece) => piece.includes(':')))
        let bindingName = document.getText(wordRange)

        if (!isProperFile
            || !wordRange
            || lineRange.text[wordRange.end.character] !== ':'
            || lineRange.text[wordRange.start.character - 1] === ':' // eliminate middle uids
            || _.first(uid.split(':')) !== bindingName) {
            // not a 'binding:thing:name' syntax
            return;
        }

        let contents: MarkedString[] = [bindingName, {
            language: 'markdown',
            value: `Open ${bindingName} binding documentation.`
        }]
        return new Hover(contents)
    }
}
