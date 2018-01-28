import {
    Selection,
    SnippetString,
    TextDocument,
    window
} from 'vscode'

import * as _ from 'lodash'
import * as s from 'underscore.string'
import * as AsciiTable from 'ascii-table'

import { Thing } from './Thing'
import { Channel } from './Channel'

import * as nls from 'vscode-nls'
const localize = nls.loadMessageBundle()

const CHANNEL_TEMPLATE = (channel: Channel): SnippetString => {
    if (channel.kind === 'STATE') {
        let name = s.classify(channel.id);
        let label = channel.label || s(channel.id)
            .replaceAll('#', ' ')
            .humanize()
            .value()

        return new SnippetString(
            `${channel.itemType} ${name} "${label}" {channel="${channel.uid}"}`
        )
    } else {
        window.showErrorMessage(localize("channelTemplate.stateError.text","\"{0}\" is a {1} channel.", channel.uid, channel.kind))
    }
}

const THING_TEMPLATE = (thing: Thing): SnippetString => {
    if (thing.channels.length) {
        let table = new AsciiTable()
        let channels = _(thing.channels)
            .filter(channel => channel.kind === 'STATE')
            .map((channel: Channel) => {
                let name = s.classify(thing.label) + '_' + s.classify(channel.id);
                let label = channel.label || s(channel.id)
                    .replaceAll('#', ' ')
                    .humanize()
                    .value()
                return [channel.itemType, name, `"${label}"`, `{channel="${channel.uid}"}`]
            })
            .value()

        return new SnippetString(
            table
                .addRowMatrix(channels)
                .removeBorder()
                .toString()
                .split('\n')
                .map(line => line.trim())
                .join('\n')
        )
    } else {
        window.showErrorMessage(localize("thingTemplate.noChannelsError.text", "Thing \"{0}\" has no channels.", thing.label))
    }
}

/**
 * Creates a dynamic snippet for the Items
 * 
 * Kuba Wolanin - Initial contribution
 */
export class ItemsProvider {

    constructor(private treeItem: Thing | Channel) {
    }

    /**
     * Creates a dynamic sitemap partial snippet based on Item's properties.
     * Note: this will insert the snippet only if
     * currently open file has a `sitemap` extension.
     */
    public addToItems() {
        let editor = window.activeTextEditor
        let document = editor.document

        if (document.fileName.endsWith('items')) {
            let template

            if (this.treeItem.treeItemType === 'thing') {
                template = THING_TEMPLATE(<Thing>this.treeItem)
            } else {
                template = CHANNEL_TEMPLATE(<Channel>this.treeItem)
            }

            editor.insertSnippet(template, editor.selection.active)
        } else {
            window.showInformationMessage(localize('addToItems.wrongFileEnding.text','Please open "*.items" file in the editor to add a new snippet.'))
        }
    }
}
