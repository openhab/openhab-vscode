import {
    CancellationToken,
    ReferenceProvider,
    Location,
    Position,
    Range,
    TextDocument,
    Uri,
    workspace
} from 'vscode'

import { readFile } from 'fs'
import * as _ from 'lodash'
import * as path from 'path'

/**
 * Finds reference to an Item
 * https://code.visualstudio.com/docs/extensionAPI/language-support#_find-all-references-to-a-symbol
 *
 * Kuba Wolanin - Initial contribution
 */
export class ItemReference implements ReferenceProvider {
    public provideReferences(document: TextDocument, position: Position, options: { includeDeclaration: boolean }, token: CancellationToken): Thenable<Location[]> {
        return this.doFindReferences(document, position, options, token)
    }

    private findFiles(selectedText): Thenable<any> {
        return new Promise(resolve => {
            workspace.findFiles('**/*.{items,things,persist,script,rules,sitemap}', '').then(uris => {
                let textPromises = uris.map(uri => {
                    let resource = Uri.file(uri.fsPath)
                    workspace.openTextDocument(resource).then((doc) => {
                        // doc.getWordRangeAtPosition
                        resolve(doc)
                    })
                })
            })
        })
            
                // new Promise<any>((resolve, reject) =>
                //     readFile(decodeURI(uri.fsPath), encoding, (err, data) => {
                //         if (err) {
                //             reject(err)
                //         } else {
                //             resolve({
                //                 uri: uri.fsPath,
                //                 text: data.toString()
                //             })
                //         }
                //     })
                // )

        //     return Promise.all(textPromises).then(docs => {
        //         let filtered = _.filter(docs, (item) => {
        //             return item.text.indexOf(selectedText) > -1
        //         })

        //         return docs //filtered
        //     })
        // })
    }

    private doFindReferences(document: TextDocument, position: Position, options: { includeDeclaration: boolean }, token: CancellationToken): Thenable<Location[]> {
        return new Promise<Location[]>((resolve, reject) => {
            let filename = document.fileName
            let cwd = path.dirname(filename)

            // get current word
            let wordRange = document.getWordRangeAtPosition(position)
            if (!wordRange) {
                return resolve([])
            }

            let selectedText = document.getText(wordRange)
            let referencesSet = new Set();

            this.findFiles(selectedText).then((docs) => {
                resolve(docs.map(doc => {
                    return new Location(doc.uri, new Range(6, 2, 6, 6))
                }))
            })

            token.onCancellationRequested(() => { })
        })

    }
}
