import { IItem } from './IItem'
import * as _ from 'lodash'

export class Item {

    constructor(private item: IItem) {
    }

    /**
     * Item name, e.g. 'Kitchen_Temperature'
     */
    public get name(): string {
        return this.item.name;
    }

    /**
     * Item type
     * Color|Contact|DateTime|Dimmer|Group|Number|Player|Rollershutter|String|Switch
     */
    public get type(): string {
        return this.item.type;
    }

    /**
     * Item label, e.g. "Kitchen thermometer"
     */
    public get label(): string {
        return this.item.label;
    }

    /**
     * Item state, e.g. 'OFF' or '22'
     */
    public get state(): string {
        var nullType: string[] = ['NULL', 'UNDEF']
        return !_.includes(nullType, this.item.state) ? this.item.state : '';
    }

    /**
     * Relative path to the item
     * e.g. '/rest/items/Ground_Floor'
     */
    public get path(): string {
        return '/rest/items/' + this.item.name;
    }

    /**
     * Relative path to item's icon
     * e.g. '/icon/kitchen?format=svg'
     */
    public get icon(): string {
        let icon = this.item.category || 'none'
        return icon + '.svg'
        // return '/icon/' + icon + '?format=svg'
    }

    /**
     * True if type of the item is equal to 'Group'
     */
    public get isGroup(): boolean {
        return this.item.type === 'Group'
    }

    /**
     * True if the item doesn't belong to any group
     */
    public get isRootItem(): boolean {
        return this.item.groupNames && this.item.groupNames.length === 0;
    }

    /**
     * True if type of the item is equal to 'Group'
     */
    public get members(): IItem[] {
        return this.isGroup && this.item.members
    }
}
