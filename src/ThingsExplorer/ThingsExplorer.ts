import {
    Event,
    EventEmitter,
    TreeDataProvider,
    TreeItem,
    TreeItemCollapsibleState,
    workspace
} from 'vscode'

import * as path from 'path'
import * as _ from 'lodash'
import { Channel } from './Channel'
import { Thing } from './Thing'
import { ThingsModel } from './ThingsModel'

/**
 * Produces a tree view of openHAB things
 * collected from REST API
 * 
 * Kuba Wolanin - Initial contribution
 */
export class ThingsExplorer implements TreeDataProvider<Thing|Channel> {

    private _onDidChangeTreeData: EventEmitter<any> = new EventEmitter<any>()
    readonly onDidChangeTreeData: Event<any> = this._onDidChangeTreeData.event

    constructor(private openhabHost: string) {
    }

    private model: ThingsModel

    refresh(): void {
        this._onDidChangeTreeData.fire()
    }

    private getThingIcon(shade: string, isOnline) {
        let name = isOnline ? 'green-circle': 'gray-circle'
        return path.join(__filename, '..', '..', '..', '..', 'resources', shade, name + '.svg')
    }

    private getChannelIcon(shade: string, channel: Channel) {
        let name = 'empty-gray-circle'
        if (channel.kind === 'STATE') {
            name = channel.linkedItems.length ? 'full-circle': 'empty-circle'
        }
        return path.join(__filename, '..', '..', '..', '..', 'resources', shade, name + '.svg')
    }

    public getTreeItem(treeItem): TreeItem {
        let item = {
            label: treeItem.label || treeItem.id,
            contextValue: treeItem.treeItemType,
        }
        if (treeItem.treeItemType === 'thing') {
            return _.extend(item, {
                collapsibleState: treeItem.hasChannels ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None,
                command: void 0,
                iconPath: {
                    light: this.getThingIcon('light', treeItem.isOnline),
                    dark: this.getThingIcon('dark', treeItem.isOnline)
                }
            })
        }

        return _.extend(item, {
            collapsibleState: TreeItemCollapsibleState.None,
            iconPath: {
                light: this.getChannelIcon('light', treeItem),
                dark: this.getChannelIcon('dark', treeItem)
            }
        })
    }

    public getChildren(thing?: Thing): Thing[] | Thenable<Thing[]> | Channel[] | Thenable<Channel[]> {
        let config = workspace.getConfiguration('openhab')
        if (!thing && config.useRestApi) {
            if (!this.model) {
                this.model = new ThingsModel(this.openhabHost)
            }

            return this.model.roots
        }

        return this.model.getChildren(thing)
    }
}
