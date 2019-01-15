import {
    SnippetString,
    window,
    workspace
} from 'vscode'

import * as _ from 'lodash'
import * as AsciiTable from 'ascii-table'

import { Thing } from './Thing'
import { Channel } from './Channel'
import { humanize } from '../Utils'

/** generate an Item name from a Thing label by using the configured casing */
function generateItemName(label: string) : string {
    const config = workspace.getConfiguration('openhab');
    switch(config.get('itemCasing')) {
        case 'snake':
            // upper snake case, 'Guest Room Light' -> 'Guest_Room_Light'
            return _.startCase(label).replace(/ /g, "_");
        default:
            // camel case, 'Guest Room Light' -> 'GuestRoomLight'
            return _.startCase(label).replace(/ /g, "");
    }
}

const CHANNEL_TEMPLATE = (channel: Channel): SnippetString => {
    if (channel.kind === 'STATE') {
        const name = generateItemName(channel.id);
        const label = humanize(
            (channel.label || channel.id).replace(/#/g, ' ')
        );
        return new SnippetString(
            `${channel.itemType} ${name} "${label}" {channel="${channel.uid}"}`
        )
    } else {
        window.showErrorMessage(`"${channel.uid}" is a ${channel.kind} channel.`)
    }
}

const THING_TEMPLATE = (thing: Thing): SnippetString => {
    if (thing.channels.length) {
        let table = new AsciiTable()
        let channels = _(thing.channels)
            .filter(channel => channel.kind === 'STATE')
            .map((channel: Channel) => {
                const name = generateItemName(`${thing.label} ${channel.id}`);
                const label = humanize(
                    (channel.label || channel.id).replace(/#/g, ' ')
                );
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
        window.showErrorMessage(`Thing "${thing.label}" has no channels.`)
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
            window.showInformationMessage('Please open "*.items" file in the editor to add a new snippet.')
        }
    }
}
