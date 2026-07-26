import { Hover, MarkdownString } from 'vscode'

import * as utils from '../Utils/Utils'

/**
 * Handles hover actions in editor windows.
 * Provides additional information for existing items and other entities.
 *
 * @author Jerome Luckenbach - Initial contribution
 * @author Patrik Gfeller - Replace axios with native fetch (#332)
 * @author Patrik Gfeller - Simplify URL request logging (#362)
 */
export class HoverProvider {
    /**
     * Array of known Items from the openHAB environment
     */
    private knownItems: string[] = []

    /**
     * Regex for Thread::sleep() expression
     */
    public static THREAD_SLEEP_REGEX: RegExp = /(?<=sleep\()[0-9]{1,9}(?=\))/gm

    /**
     * Regex for all hover-relevant wordings
     * Matches: sleep(nnn), key="value", key='value', key=value, or plain words
     */
    public static HOVERED_WORD_REGEX: RegExp = /(?<=sleep\()[0-9]{1,9}(?=\)){1}|\w+=(?:"[^"]*"|'[^']*'|\S+)|\w+/gm

    /**
     * Only allow the class to call the constructor
     */
    public constructor() {
        this.updateItems()
    }

    /**
     * Checks hovered editor area for existing openHAB Items and provides some live data from rest api if aan item name is found.
     *
     *
     * @param hoveredText The currently hovered text part
     * @returns A thenable [Hover](Hover) object with live information or null if no item is found
     */
    public getHover(hoveredText: string, hoveredLine: string): Thenable<Hover> | null {
        console.log(`Checking if text can get a hover information.`)

        console.debug(`Checking if => ${hoveredLine} <= includes a Thread::sleep()`)
        const lineMatch = hoveredLine.match(HoverProvider.THREAD_SLEEP_REGEX)

        if (lineMatch && lineMatch.length == 1) return this.getReadableThreadSleep(hoveredLine)

        // If hoveredText is a key=value pair (e.g. item=FF_Bath_Light or label="My Label"),
        // extract the value for item lookup so sitemap/rules references like item=X work correctly.
        const kvMatch = hoveredText.match(/^\w+=(?:"([^"]*)"|'([^']*)'|(\w+))$/)
        const lookupText = kvMatch ? (kvMatch[1] ?? kvMatch[2] ?? kvMatch[3]) : hoveredText

        console.debug(`Checking if => ${lookupText} <= is a known Item now`)
        if (this.knownItems.includes(lookupText)) return this.getRestItemHover(lookupText)

        console.log(`Nothing to hover, waiting...`)
        return null
    }

    /**
     * Generates a human readable time string from the given *Thread::sleep()* time in millisenconds
     *
     * @param hoveredLine The complete hovered line for further processing
     * @returns A thenable [Hover](Hover) object with a readable sleeping time
     */
    private getReadableThreadSleep(hoveredLine: string): Thenable<Hover> {
        let match: number = parseInt(hoveredLine.match(HoverProvider.THREAD_SLEEP_REGEX)[0])

        return new Promise((resolve, reject) => {
            let resultText = new MarkdownString()
            resultText.appendCodeblock(this.humanReadableDuration(match), 'openhab')

            resolve(new Hover(resultText))
        })
    }

    /**
     * Provides some live data from rest api if an item name is found.
     *
     * @param hoveredText The currently hovered text part
     * @returns A thenable [Hover](Hover) object with live information or null if no item is found
     */
    private getRestItemHover(hoveredText: string): Thenable<Hover> {
        return new Promise((resolve, reject) => {
            const url = utils.getHost(false) + `/rest/items/${hoveredText}`
            console.log(`Requesting => ${url} <= now`)
            const headers = utils.getAuthHeaders()

            fetch(url, { headers })
                .then((response) => {
                    if (!response.ok) throw Object.assign(new Error(response.statusText), { status: response.status })
                    return response.json() as Promise<any>
                })
                .then((result) => {
                    if (result.error) {
                        return
                    }
                    let resultText = new MarkdownString()

                    // Show Member Information for Group Items too
                    if (result.type === 'Group') {
                        resultText.appendCodeblock(`Item ${result.name} | ${result.state}`, 'openhab')
                        resultText.appendMarkdown(`##### Members:`)

                        result.members.forEach((member, key, result) => {
                            resultText.appendCodeblock(`Item ${member.name} | ${member.state}`, 'openhab')

                            // No newline after the last member information
                            if (!Object.is(result.length - 1, key)) {
                                resultText.appendText(`\n`)
                            }
                        })
                    } else {
                        resultText.appendCodeblock(`${result.state}`, 'openhab')
                    }

                    resolve(new Hover(resultText))
                })
                .catch(() => reject(false))
        })
    }

    /**
     * Converts and formats a given millisecond duration into a readable format
     *
     * @param msDuration Duration for formatting
     * @returns Formatted readable Duration String
     */
    private humanReadableDuration(msDuration: number): string {
        const h = Math.floor(msDuration / 1000 / 60 / 60)
        const m = Math.floor((msDuration / 1000 / 60 / 60 - h) * 60)
        const s = Math.floor(((msDuration / 1000 / 60 / 60 - h) * 60 - m) * 60)
        const ms = msDuration - h * 3600 * 1000 - m * 60 * 1000 - s * 1000

        return `${h != 0 ? h + ' hours ' : ''}${m != 0 ? m + ' minutes ' : ''}${s != 0 ? s + ' seconds ' : ''}${ms != 0 ? ms + ' milliseconds ' : ''}`
    }

    /**
     * Update known Items array
     *
     * @returns A Promise that resolves to **true** when update was successful, **false** otherwise
     */
    public updateItems(): Promise<boolean> {
        const headers = utils.getAuthHeaders()

        return fetch(`${utils.getHost(false)}/rest/items`, { headers })
            .then((response) => {
                if (!response.ok) throw Object.assign(new Error(response.statusText), { status: response.status })
                return response.json() as Promise<any[]>
            })
            .then((result) => {
                // Clear possible existing array
                this.knownItems = []

                result.forEach((item) => {
                    this.knownItems.push(item.name)
                })

                console.log(`Updates Items for HoverProvider`)
                return true
            })
            .catch((error) => {
                console.error(`Failed to update Items for HoverProvider`, error)
                utils.appendToOutput(`Could not reload items for HoverProvider`)
                utils.handleRequestError(error)

                // Ensure knownItems is still an array even on error
                this.knownItems = []

                return false
            })
    }
}
