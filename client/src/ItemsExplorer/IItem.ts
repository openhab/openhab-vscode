import { Uri } from 'vscode'

/**
 * Interface describing an openHAB Item structure
 *
 * @author Kuba Wolanin - Initial contribution
 */
export interface IItem {
    /**
     * Direct URL to openHAB item
     */
    link?: string | Uri

    /**
     * Current state of the item, e.g. "OFF" or "22"
     */
    state: string

    /**
     * Format of the state visible to the end user
     */
    stateDescription?: { pattern: string; readOnly: boolean; options: any[] }

    /**
     * openHAB Item type, e.g. "String", "Number", "DateTime"
     */
    type: string

    /**
     * Unique item's name, e.g. "Kitchen_Door"
     */
    name: string

    /**
     * Human readable label, e.g. "Kitchen door sensor"
     */
    label: string

    /**
     * Used for the ESH icon set, e.g. "kitchen"
     */
    category?: string

    /**
     * Indicates if the item is a Group type
     */
    members?: IItem[]

    /**
     * Items tags.
     */
    tags?: string[]

    /**
     * Array of Groups the Item belongs to
     */
    groupNames?: string[]
}