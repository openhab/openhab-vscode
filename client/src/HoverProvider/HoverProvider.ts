import { Hover, MarkdownString, Uri, workspace } from 'vscode'

import * as utils from '../Utils/Utils'
import { ConfigManager } from '../Utils/ConfigManager'
import { OH_CONFIG_PARAMETERS } from '../Utils/types'
import { ReferenceSearchProvider, FileLocationRef } from './ReferenceSearchProvider'

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
     * Searches the workspace for item definitions and references
     */
    private referenceSearch: ReferenceSearchProvider = new ReferenceSearchProvider()

    /**
     * Remembers, per item name, the location the user was at right before jumping to a
     * reference for that item. Lets a "Back to ..." link be shown at the destination,
     * so the user can look something up and then jump straight back to continue editing.
     */
    private jumpBackOrigin = new Map<string, { uri: string; line: number }>()

    /**
     * Regex for Thread::sleep() expression
     */
    public static THREAD_SLEEP_REGEX: RegExp = /(?<=sleep\()[0-9]{1,9}(?=\))/gm

    /**
     * Regex for all hover-relevant wordings
     */
    public static HOVERED_WORD_REGEX: RegExp = /(?<=sleep\()[0-9]{1,9}(?=\)){1}|(\w+){1}/gm

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
     * @param hoveredLine The full text of the line being hovered over
     * @param currentUri The uri (as string) of the document being hovered over
     * @param currentLine The zero-based line number being hovered over
     * @returns A thenable [Hover](Hover) object with live information or null if no item is found
     */
    public getHover(
        hoveredText: string,
        hoveredLine: string,
        currentUri?: string,
        currentLine?: number
    ): Promise<Hover | null> | null {
        console.log(`Checking if text can get a hover information.`)

        console.debug(`Checking if => ${hoveredLine} <= includes a Thread::sleep()`)
        const lineMatch = hoveredLine.match(HoverProvider.THREAD_SLEEP_REGEX)

        if (lineMatch && lineMatch.length == 1) return this.getReadableThreadSleep(hoveredLine)

        console.debug(`Checking if => ${hoveredText} <= is a known Item now`)
        const isKnownItem = this.knownItems.includes(hoveredText)

        if (!isKnownItem) {
            console.log(`Nothing to hover, waiting...`)
            return null
        }

        return this.getComposedHover(hoveredText, currentUri, currentLine)
    }

    /**
     * Composes the full hover: live/log state plus workspace reference sections.
     *
     * @param hoveredText The currently hovered text part
     * @param currentUri The uri (as string) of the document being hovered over
     * @param currentLine The zero-based line number being hovered over
     * @returns A promise resolving to a [Hover](Hover) object, or null if nothing was found
     */
    private getComposedHover(hoveredText: string, currentUri?: string, currentLine?: number): Promise<Hover | null> {
        const statePromise: Promise<MarkdownString | null> = this.getRestItemMarkdown(hoveredText)

        return Promise.all([statePromise, this.getReferencesMarkdown(hoveredText, currentUri, currentLine)]).then(
            ([stateMarkdown, referencesMarkdown]) => {
                if (!stateMarkdown && !referencesMarkdown) return null

                const combined = new MarkdownString()
                combined.isTrusted = { enabledCommands: ['openhab.command.hover.openLocation'] }

                if (stateMarkdown) combined.appendMarkdown(stateMarkdown.value)
                if (stateMarkdown && referencesMarkdown) combined.appendMarkdown('\n\n---\n\n')
                if (referencesMarkdown) combined.appendMarkdown(referencesMarkdown.value)

                return new Hover(combined)
            }
        )
    }

    /**
     * Generates a human readable time string from the given *Thread::sleep()* time in millisenconds
     *
     * @param hoveredLine The complete hovered line for further processing
     * @returns A thenable [Hover](Hover) object with a readable sleeping time
     */
    private getReadableThreadSleep(hoveredLine: string): Promise<Hover> {
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
     * @returns A promise resolving to a [MarkdownString](MarkdownString) with live information, or null on error
     */
    private getRestItemMarkdown(hoveredText: string): Promise<MarkdownString | null> {
        const url = utils.getHost(false) + `/rest/items/${hoveredText}`
        console.log(`Requesting => ${url} <= now`)
        const headers = utils.getAuthHeaders()

        return fetch(url, { headers })
            .then((response) => {
                if (!response.ok) throw Object.assign(new Error(response.statusText), { status: response.status })
                return response.json() as Promise<any>
            })
            .then((result) => {
                if (result.error) return null

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

                return resultText
            })
            .catch(() => null)
    }

    /**
     * Builds the "Defined in" / "Used in Rules" / "Used in Sitemaps" / "Used in Scripts" sections
     * for the hovered item, based on the current workspace reference search.
     *
     * @param hoveredText The currently hovered text part
     * @param currentUri The uri (as string) of the document being hovered over
     * @param currentLine The zero-based line number being hovered over
     * @returns A promise resolving to a [MarkdownString](MarkdownString) with the reference sections, or null if none are enabled/found
     */
    private getReferencesMarkdown(
        hoveredText: string,
        currentUri?: string,
        currentLine?: number
    ): Promise<MarkdownString | null> {
        const showDefinitions = ConfigManager.get(OH_CONFIG_PARAMETERS.hover.showItemDefinition) as boolean
        const showThings = ConfigManager.get(OH_CONFIG_PARAMETERS.hover.showThingsReferences) as boolean
        const showRules = ConfigManager.get(OH_CONFIG_PARAMETERS.hover.showRuleReferences) as boolean
        const showSitemaps = ConfigManager.get(OH_CONFIG_PARAMETERS.hover.showSitemapReferences) as boolean
        const showScripts = ConfigManager.get(OH_CONFIG_PARAMETERS.hover.showScriptReferences) as boolean

        const jumpBackLink = this.getJumpBackLink(hoveredText, currentUri, currentLine)

        if (!showDefinitions && !showThings && !showRules && !showSitemaps && !showScripts) {
            return Promise.resolve(jumpBackLink ? new MarkdownString(jumpBackLink) : null)
        }

        if (!workspace.workspaceFolders || workspace.workspaceFolders.length === 0) {
            return Promise.resolve(jumpBackLink ? new MarkdownString(jumpBackLink) : null)
        }

        return this.referenceSearch
            .findReferences(hoveredText)
            .then((result) => {
                const max = (ConfigManager.get(OH_CONFIG_PARAMETERS.hover.maxReferencesPerCategory) as number) || 10
                const resultText = new MarkdownString()
                let any = false

                if (jumpBackLink) {
                    resultText.appendMarkdown(jumpBackLink)
                    any = true
                }

                if (showDefinitions)
                    any =
                        this.appendCategory(
                            resultText,
                            'Defined in',
                            result.definitions,
                            max,
                            hoveredText,
                            currentUri,
                            currentLine
                        ) || any
                if (showThings)
                    any =
                        this.appendCategory(
                            resultText,
                            'Used in Things',
                            result.things,
                            max,
                            hoveredText,
                            currentUri,
                            currentLine
                        ) || any
                if (showRules)
                    any =
                        this.appendCategory(
                            resultText,
                            'Used in Rules',
                            result.rules,
                            max,
                            hoveredText,
                            currentUri,
                            currentLine
                        ) || any
                if (showSitemaps)
                    any =
                        this.appendCategory(
                            resultText,
                            'Used in Sitemaps',
                            result.sitemaps,
                            max,
                            hoveredText,
                            currentUri,
                            currentLine
                        ) || any
                if (showScripts)
                    any =
                        this.appendCategory(
                            resultText,
                            'Used in Scripts',
                            result.scripts,
                            max,
                            hoveredText,
                            currentUri,
                            currentLine
                        ) || any

                return any ? resultText : null
            })
            .catch((e) => {
                console.debug(`Reference search failed for '${hoveredText}': ${e}`)
                return null
            })
    }

    /**
     * Appends a capped, clickable list of file locations for one reference category.
     *
     * @returns **true** if the category had at least one reference (and something was appended)
     */
    private appendCategory(
        resultText: MarkdownString,
        title: string,
        refs: FileLocationRef[],
        max: number,
        itemName: string,
        currentUri?: string,
        currentLine?: number
    ): boolean {
        if (refs.length === 0) return false

        resultText.appendMarkdown(`\n\n**${title}** (${refs.length})\n\n`)

        refs.slice(0, max).forEach((ref) => {
            resultText.appendMarkdown(`- ${this.locationLink(ref, itemName, currentUri, currentLine)}\n`)
        })

        if (refs.length > max) {
            resultText.appendMarkdown(`- _+${refs.length - max} more_\n`)
        }

        return true
    }

    /**
     * Records where the user was hovering right before jumping to a reference for the given
     * item, so a "Back to ..." link can be shown once they're done looking something up at
     * the destination and want to return to continue editing.
     *
     * @param itemName The item name the jump was made for
     * @param uri The uri (as string) of the file the user was hovering over before jumping
     * @param line The zero-based line number the user was hovering over before jumping
     */
    public recordJumpOrigin(itemName: string, uri: string, line: number): void {
        this.jumpBackOrigin.set(itemName, { uri, line })
    }

    /**
     * Builds a "Back to ..." command-link pointing to the location the user was at right
     * before they last jumped away from it (via a reference link) for this item.
     * Returns null if there's no recorded origin, or if it's the location currently being hovered over.
     */
    private getJumpBackLink(itemName: string, currentUri?: string, currentLine?: number): string | null {
        const origin = this.jumpBackOrigin.get(itemName)
        if (!origin) return null
        if (origin.uri === currentUri && origin.line === currentLine) return null

        const relativePath = workspace.asRelativePath(Uri.parse(origin.uri), false)
        const args = encodeURIComponent(JSON.stringify([origin.uri, origin.line]))

        return `↩ [Back to ${relativePath}:${origin.line + 1}](command:openhab.command.hover.openLocation?${args})\n\n---\n\n`
    }

    /**
     * Builds a Markdown command-link that jumps to the given file location.
     * Also passes along the location currently being hovered over, so that once clicked, it can
     * be remembered as the place to jump back to (see recordJumpOrigin() / getJumpBackLink()).
     */
    private locationLink(ref: FileLocationRef, itemName: string, currentUri?: string, currentLine?: number): string {
        const relativePath = workspace.asRelativePath(ref.uri, false)
        const args = encodeURIComponent(
            JSON.stringify([ref.uri.toString(), ref.line, itemName, currentUri, currentLine])
        )

        return `[${relativePath}:${ref.line + 1}](command:openhab.command.hover.openLocation?${args})`
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

    /**
     * Invalidates the cached workspace reference search results.
     * Should be called when *.items, *.rules, *.sitemap or *.js files change.
     */
    public invalidateReferenceCache(): void {
        this.referenceSearch.invalidate()
    }
}
