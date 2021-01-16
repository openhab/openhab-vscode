import {
    Hover,
    MarkdownString
} from 'vscode'

import * as utils from '../Utils'
import * as request from 'request-promise-native'

/**
 * Handles hover actions in editor windows.
 * Provides additional information for existing items through rest api.
 *
 * @author Jerome Luckenbach - Initial contribution
 */
export class HoverProvider {

    /**
     * Only allow a single provider to exist at a time.
     */
    private static _currentProvider: HoverProvider | undefined

    /**
     * Array of known Items from the openHAB environment
     */
    private  knownItems:String[]

    /**
     * Only allow the class to call the constructor
     */
    public constructor(){
        this.updateItems()
    }

    /**
     * Checks hovered editor area for existing openHAB Items and provides some live data from rest api if aan item name is found.
     *
     * @param hoveredText The currently hovered text part
     * @returns A thenable [Hover](Hover) object with live information or null if no item is found
     */
    public getRestHover(hoveredText) : Thenable<Hover>|null {
        console.log(`Checking if => ${hoveredText} <= is a known Item now`)
        if(this.knownItems.includes(hoveredText)){
            return new Promise((resolve, reject) => {
                console.log(`Requesting => ${utils.getHost()}/rest/items/${hoveredText} <= now`)

                request(`${utils.getHost()}/rest/items/${hoveredText}`)
                    .then((response) => {
                        let result = JSON.parse(response)

                        if(!result.error) {
                            let resultText = new MarkdownString()

                            // Show Member Information for Group Items too
                            if(result.type === "Group"){
                                resultText.appendCodeblock(`Item ${result.name} | ${result.state}`, 'openhab')
                                resultText.appendMarkdown(`##### Members:`)

                                result.members.forEach( (member, key, result) => {
                                    resultText.appendCodeblock(`Item ${member.name} | ${member.state}`, 'openhab')

                                    // No newline after the last member information
                                    if(!Object.is(result.length - 1, key)){
                                        resultText.appendText(`\n`)
                                    }
                                })
                            }
                            else{
                                resultText.appendCodeblock(`${result.state}`, 'openhab')
                            }

                            resolve(new Hover(resultText))
                        }
                    })
                    .catch(() => reject(false))
            })
        }
        else {
            console.log(`That's no openHAB item. Waiting for the next hover.`)
            return null
        }
    }

    /**
     * Update known Items array
     */
    public updateItems() : Boolean {

        request(`${utils.getHost()}/rest/items/`)
            .then((response) => {
                // Clear prossible existing array
                this.knownItems = new Array<String>()

                let result = JSON.parse(response)

                result.forEach(item => {
                    this.knownItems.push(item.name)
                })

                console.log(`Updates Items for HoverProvider`)
                return true
            })
            .catch((error) => {
                console.error(`Failed to update Items for HoverProvider`, error)
                utils.appendToOutput(`Could not reload items for HoverProvider`)
                utils.handleRequestError(error)

                return false
            })
        return false
    }
}
