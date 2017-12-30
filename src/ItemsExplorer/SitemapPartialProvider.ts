import {
    Selection,
    SnippetString,
    TextDocument,
    window
} from 'vscode'

import { Item } from './Item'

const SNIPPET_TEMPLATE = (item: Item): SnippetString => {
    let snippet = 'Default item=' + item.name + (item.label ? ` label="${item.label}"` : '')

    if (item.members.length) {
        let members = item.members.map(member => `Default item=${member.name} label="${member.label || ''}"`)
        snippet = `
Text item=${item.name} label="${item.label}" icon="${item.category || 'none'}" {
    ${members.join('\n    ')}
}`
    }
    return new SnippetString(snippet)
}

/**
 * Creates a dynamic snippet for a sitemap
 * 
 * Kuba Wolanin - Initial contribution
 */
export class SitemapPartialProvider {

    constructor(private item: Item) {
    }

    /**
     * Creates a dynamic sitemap partial snippet based on Item's properties.
     * Note: this will insert the snippet only if
     * currently open file has a `sitemap` extension.
     */
    public addToSitemap() {
        let editor = window.activeTextEditor
        let document = editor.document

        if (document.fileName.endsWith('sitemap')) {
            editor.insertSnippet(SNIPPET_TEMPLATE(this.item), editor.selection.active)
        } else {
            window.showInformationMessage('Please open "*.sitemap" file in the editor to add a new snippet.')
        }
    }
}
