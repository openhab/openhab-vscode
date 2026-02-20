import { execSync } from 'child_process'
import * as fs from 'fs'
import { ConfigManager } from '../Utils/ConfigManager'
import { OH_CONFIG_PARAMETERS } from '../Utils/types'

/**
 * Result of a log search operation.
 */
export interface LogSearchResult {
    /** Timestamp from the log line */
    timestamp: string
    /** Item or thing name extracted from the log line (if any) */
    itemName: string | null
    /** Latest state value extracted from the log line (if any) */
    state: string | null
    /** The event type: 'changed', 'command', 'thingStatus', or 'unknown' */
    eventType: 'changed' | 'command' | 'thingStatus' | 'unknown'
    /** The full raw log line */
    rawLine: string
    /** Where the result came from */
    source: 'file'
    /** Whether the state was extracted from a key=value pattern in the raw line */
    kvFromLine?: boolean
}

// Regex patterns for parsing events.log lines
const RE_STATE_CHANGED = /Item '([^']+)' changed from (.+?) to (.+?)(?:\s+\(source: .+\))?$/
const RE_GROUP_CHANGED = /Item '([^']+)' changed from (.+?) to (.+?) through (\S+)$/
const RE_COMMAND       = /Item '([^']+)' received command (.+?)(?:\s+\(source: .+\))?$/
const RE_THING_STATUS  = /Thing '([^']+)' changed from (.+?) to (.+)$/
const RE_TIMESTAMP     = /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3})/

/**
 * Searches OpenHAB events.log for expressions, extracting state information.
 *
 * Strategy:
 *   1. Try reading the log file directly (fast, uses grep)
 *   2. Fall back to querying frontail if configured and file not accessible
 *
 * @author OpenHAB VSCode Extension
 */
export class LogSearchProvider {

    /**
     * Search the events log for the latest mention of an expression.
     *
     * @param expression The text to search for (typically an item name)
     * @returns A LogSearchResult if found, null otherwise
     */
    async searchLog(expression: string): Promise<LogSearchResult | null> {
        // Sanitize: only search for reasonable identifiers
        if (!expression || expression.length < 2 || expression.length > 100) {
            return null
        }

        let bestResult: LogSearchResult | null = null

        // Search events.log
        const eventsLogPath = ConfigManager.get(OH_CONFIG_PARAMETERS.log.eventsLogPath) as string | null
        if (eventsLogPath) {
            try {
                const result = this._searchLogFile(expression, eventsLogPath)
                if (result) bestResult = result
            } catch (e) {
                console.debug(`LogSearch: events.log search failed for '${expression}': ${e}`)
            }
        }

        // Search openhab.log
        const openhabLogPath = ConfigManager.get(OH_CONFIG_PARAMETERS.log.openhabLogPath) as string | null
        if (openhabLogPath) {
            try {
                const result = this._searchLogFile(expression, openhabLogPath)
                if (result) {
                    // Keep the result with the more recent timestamp
                    if (!bestResult || result.timestamp > bestResult.timestamp) {
                        bestResult = result
                    }
                }
            } catch (e) {
                console.debug(`LogSearch: openhab.log search failed for '${expression}': ${e}`)
            }
        }

        if (bestResult) return this.enhanceWithKeyValue(expression, bestResult)

        return null
    }

    /**
     * Search the log file directly using grep (efficient for large files).
     * Uses `grep` piped to `tail -1` to get only the last matching line.
     */
    private _searchLogFile(expression: string, logPath: string): LogSearchResult | null {
        if (!fs.existsSync(logPath)) {
            console.debug(`LogSearch: log file not found at ${logPath}`)
            return null
        }

        // Escape for safe shell usage: replace single quotes with escaped version for grep
        const safeExpr = expression.replace(/'/g, "'\\''")
        if (!safeExpr || safeExpr.replace(/[^a-zA-Z0-9]/g, '').length < 2) return null

        try {
            // Use grep -F for fixed string (fast), pipe to tail -1 for last match
            const cmd = `grep -F '${safeExpr}' '${logPath}' | tail -1`
            const output = execSync(cmd, {
                encoding: 'utf8' as const,
                timeout: 3000,   // 3 second timeout
                maxBuffer: 4096, // We only need one line
            }).trim()

            if (!output) return null

            return this._parseLine(output, 'file')
        } catch (e) {
            // grep returns exit code 1 when no matches found — that's normal
            if (e && (e as any).status === 1) return null
            throw e
        }
    }

    /**
     * Parse a single events.log line and extract structured data.
     */
    private _parseLine(line: string, source: 'file'): LogSearchResult | null {
        if (!line || line.trim().length === 0) return null

        // Extract timestamp
        const tsMatch = line.match(RE_TIMESTAMP)
        const timestamp = tsMatch ? tsMatch[1] : ''

        // Try ItemStateChangedEvent
        let m = line.match(RE_STATE_CHANGED)
        if (m) {
            return {
                timestamp,
                itemName: m[1],
                state: m[3].trim(),
                eventType: 'changed',
                rawLine: line,
                source
            }
        }

        // Try GroupItemStateChangedEvent
        m = line.match(RE_GROUP_CHANGED)
        if (m) {
            return {
                timestamp,
                itemName: m[1],
                state: m[3].trim(),
                eventType: 'changed',
                rawLine: line,
                source
            }
        }

        // Try ItemCommandEvent
        m = line.match(RE_COMMAND)
        if (m) {
            return {
                timestamp,
                itemName: m[1],
                state: m[2].trim(),
                eventType: 'command',
                rawLine: line,
                source
            }
        }

        // Try ThingStatusInfoChangedEvent
        m = line.match(RE_THING_STATUS)
        if (m) {
            return {
                timestamp,
                itemName: m[1],
                state: m[3].trim(),
                eventType: 'thingStatus',
                rawLine: line,
                source
            }
        }

        // Generic match — expression found but no structured state
        // If the search expression itself is a key="value" pair, extract state from it
        return {
            timestamp,
            itemName: null,
            state: null,
            eventType: 'unknown',
            rawLine: line,
            source
        }
    }

    /**
     * If the search expression is a key="value" or key=value pattern,
     * extract the key and value from it and enhance the result.
     */
    enhanceWithKeyValue(expression: string, result: LogSearchResult): LogSearchResult {
        if (!result) return result

        // Match key="value" or key='value' or key=value in the hovered expression itself
        const kvMatch = expression.match(/^(\w+)=(?:"([^"]*)"|'([^']*)'|(\S+))$/)
        if (kvMatch) {
            const key = kvMatch[1]
            const value = kvMatch[2] !== undefined ? kvMatch[2]
                        : kvMatch[3] !== undefined ? kvMatch[3]
                        : kvMatch[4]
            result.itemName = key
            result.state = value
            result.eventType = 'changed'
        } else if (result.rawLine) {
            // Try to find expression="value" or expression='value' or expression=value in the raw log line
            const lineKvMatch = result.rawLine.match(new RegExp(expression + '=(?:"([^"]*)"|' + "'([^']*)'"+  '|(\\S+))'))
            if (lineKvMatch) {
                result.itemName = expression
                result.state = lineKvMatch[1] !== undefined ? lineKvMatch[1]
                             : lineKvMatch[2] !== undefined ? lineKvMatch[2]
                             : lineKvMatch[3]
                result.eventType = 'changed'
                result.kvFromLine = true
            }
        }

        return result
    }
}
