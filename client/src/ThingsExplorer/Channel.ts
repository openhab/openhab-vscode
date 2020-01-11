import { IChannel } from './IChannel'
import * as _ from 'lodash'

export class Channel {

    constructor(private channel: IChannel) {
    }

    public get treeItemType(): string {
        return 'channel'
    }

    public get label(): string {
        return this.channel.label ? this.channel.label : this.id
    }

    public get id(): string {
        return this.channel.id
    }

    public get itemType(): string {
        return this.channel.itemType
    }

    public get uid(): string {
        return this.channel.uid
    }

    public get kind(): string {
        return this.channel.kind
    }

    public get binding(): string {
        return this.uid.split(':')[0]
    }

    public get linkedItems(): string[] {
        return this.channel.linkedItems
    }

}