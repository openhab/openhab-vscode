import {
    SnippetString,
    window
} from 'vscode'

import { Item } from './Item'

const RULE_TEMPLATE = (item: Item): SnippetString => {
    let label = item.label && item.label !== item.name ? `${item.label} (${item.name})` : `${item.name}`
    let state = item.type === 'String' ? `"${item.state}"` : `${item.state}`
    let statePart = item.state ? ' changed from ' + state : ' // your condition here'

    return new SnippetString(`
rule "React on ` + label + ` change/update"
when
    Item ${item.name}` + statePart + `
then
    // your logic here
end
`)
}

/**
 * Creates a dynamic rule within '*.rules' file
 *
 * @author Kuba Wolanin - Initial contribution
 */
export class RuleProvider {

    constructor(private item: Item) {
    }

    /**
     * Creates a dynamic rule snippet based on Item's properties.
     * Note: this will insert the snippet only if
     * currently open file has a `rules` extension.
     */
    public addRule() {
        let editor = window.activeTextEditor
        let document = editor.document

        if (document.fileName.endsWith('rules')) {
            let position = editor.selection.active
            let newPosition = position.with(position.line, 0)

            editor.insertSnippet(RULE_TEMPLATE(this.item), newPosition)
        } else {
            window.showInformationMessage('Please open "*.rules" file in the editor to add a new rule.')
        }
    }
}
