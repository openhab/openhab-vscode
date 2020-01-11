import { IThing } from './IThing'
import { Channel } from './Channel'
import * as _ from 'lodash'

export class Thing {

    constructor(private thing: IThing) {
    }

    public get treeItemType(): string {
        return 'thing'
    }

    public get label(): string {
        return this.thing.label
    }

    public get UID(): string {
        return this.thing.UID
    }

    public get id(): string {
        return this.UID
    }

    public get binding(): string {
        return this.UID.split(':')[0]
    }

    public get hasChannels(): boolean {
        return this.thing.channels.length > 0
    }

    public get channels(): Channel[] {
        return this.thing.channels
    }

    public get isOnline(): boolean {
        return this.thing.statusInfo.status === 'ONLINE'
    }
}