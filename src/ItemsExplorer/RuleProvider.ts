import {
    Selection,
    SnippetString,
    TextDocument,
    window
} from 'vscode'

import { Item } from './Item'

const RULE_TEMPLATE = (item: Item): SnippetString => {
    let state = item.type === 'String' ? `"${item.state}"` : `${item.state}`
    return new SnippetString(`
rule "React on ${item.label} (${item.name}) change"
when
    Item ${item.name} changed from ` + state + `
then
    // rule logic goes here
end
`)
}

/**
 * Creates a dynamic rule within '*.rules' file
 * 
 * Kuba Wolanin - Initial contribution
 */
export class RuleProvider {

    constructor(private item: Item) {
    }

    public addRule() {
        let editor = window.activeTextEditor
        let document = editor.document

        if (document.fileName.split('.')[1] === 'rules') {
            let position = editor.selection.active
            let newPosition = position.with(position.line, 0);

            editor.insertSnippet(RULE_TEMPLATE(this.item), newPosition)
        } else {
            window.showInformationMessage('Please open "*.rules" file in the editor to add a new rule.')
        }
    }
}
