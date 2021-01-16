import {
    Event,
    EventEmitter,
    extensions,
    TreeDataProvider,
    TreeItem,
    TreeItemCollapsibleState
} from 'vscode'

import { Item } from './Item'
import { ItemsModel } from './ItemsModel'
import * as path from 'path'

/**
 * Produces a tree view of openHAB items
 * collected from REST API
 *
 * @author Kuba Wolanin - Initial contribution
 */
export class ItemsExplorer implements TreeDataProvider<Item> {

    private _onDidChangeTreeData: EventEmitter<any> = new EventEmitter<any>()
    readonly onDidChangeTreeData: Event<any> = this._onDidChangeTreeData.event

    constructor() {
        this.extensionpath = extensions.getExtension("openhab.openhab").extensionPath
    }

    private extensionpath: string

    private model: ItemsModel

    refresh(): void {
        this._onDidChangeTreeData.fire()
    }

    public getTreeItem(item: Item): TreeItem {
        return {
            label: item.name + (item.state ? ' (' + item.state + ')' : ''),
            collapsibleState: item.isGroup ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None,
            contextValue: this.getViewItem(item),
            iconPath: {
                light: this.getIcon('light', item.type),
                dark: this.getIcon('dark', item.type)
            }
        };
    }

    /**
     * Used to determine a context value of the TreeItem
     * If viewItem is 'statelessItem' or 'statelessGroup',
     * "Copy State" context menu doesn't show up.
     *
     * @param item Item
     */
    private getViewItem(item): string {
        let type = item.isGroup ? 'Group' : 'Item'
        return item.state ? type : 'stateless' + type
    }

    /**
     * Returns an absolute path to the Item's type icon
     * Note: VS Code doesn't allow to display icons from external source.
     * This is why `item.icon` property is not used there.
     *
     * @param shade 'light' or 'dark' depending on the Color Theme
     * @param name icon's filename
     */
    private getIcon(shade: string, name: string) {
        return path.join(this.extensionpath, 'resources', shade, name.toLowerCase() + '.svg')
    }

    public getChildren(item?: Item): Item[] | Thenable<Item[]> {
        if (!item) {
            if (!this.model) {
                this.model = new ItemsModel()
            }

            return this.model.roots
        }

        return this.model.getChildren(item)
    }
}
