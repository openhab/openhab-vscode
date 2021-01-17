import {
    Event,
    EventEmitter,
    extensions,
    TreeDataProvider,
    TreeItem,
    TreeItemCollapsibleState
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
 * @author Kuba Wolanin - Initial contribution
 */
export class ThingsExplorer implements TreeDataProvider<Thing|Channel> {

    private _onDidChangeTreeData: EventEmitter<any> = new EventEmitter<any>()
    readonly onDidChangeTreeData: Event<any> = this._onDidChangeTreeData.event

    constructor() {
        this.extensionpath = extensions.getExtension("openhab.openhab").extensionPath
    }

    private extensionpath: string

    private model: ThingsModel

    refresh(): void {
        this._onDidChangeTreeData.fire(null)
    }

    private getThingIcon(shade: string, isOnline) {
        let name = isOnline ? 'green-circle': 'gray-circle'
        return path.join(this.extensionpath, 'resources', shade, name + '.svg')
    }

    private getChannelIcon(shade: string, channel: Channel) {
        let name = 'empty-gray-circle'
        if (channel.kind === 'STATE') {
            name = channel.linkedItems.length ? 'full-circle': 'empty-circle'
        }
        return path.join(this.extensionpath, 'resources', shade, name + '.svg')
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
        if (!thing) {
            if (!this.model) {
                this.model = new ThingsModel()
            }

            return this.model.roots
        }

        return this.model.getChildren(thing)
    }
}
