import {
    CompletionItem,
    Event,
    EventEmitter,
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
 * Kuba Wolanin - Initial contribution
 */
export class ItemsExplorer implements TreeDataProvider<Item> {

    private _onDidChangeTreeData: EventEmitter<any> = new EventEmitter<any>();
    readonly onDidChangeTreeData: Event<any> = this._onDidChangeTreeData.event;

    constructor(private openhabHost: string) {
    }

    private model: ItemsModel;

    refresh(): void {
        this._onDidChangeTreeData.fire()
    }

    public getTreeItem(item: Item): TreeItem {
        return {
            label: item.name + (item.state ? ' (' + item.state + ')' : ''),
            collapsibleState: item.isGroup ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None,
            command: item.isGroup ? void 0 : {
                command: 'openhab.command.items.editInPaperUI',
                arguments: [item.name],
                title: 'Edit in Paper UI'
            },
            contextValue: item.isGroup ? 'group' : 'item',
            iconPath: {
                light: this.getIcon('light', item.type),
                dark: this.getIcon('dark', item.type)
            }
            // TODO: VS Code doesn't allow to display icons from external source.
            // Commenting it out for now.
            //
            // iconPath: {
            //     light: this.openhabHost + item.icon,
            //     dark: this.openhabHost + item.icon
            // }
        };
    }

    private getIcon(shade: string, name: string) {
        return path.join(__filename, '..', '..', '..', '..', 'resources', shade, name.toLowerCase() + '.svg')
    }

    public getChildren(item?: Item): Item[] | Thenable<Item[]> {
        if (!item) {
            if (!this.model) {
                this.model = new ItemsModel(this.openhabHost);
            }

            return this.model.roots;
        }

        return this.model.getChildren(item);
    }

    // TODO
    public getCompletions(): Thenable<CompletionItem[]> {
        if (!this.model) {
            this.model = new ItemsModel(this.openhabHost);
        }

        let completions = this.model

        return new Promise(resolve => {
            resolve(completions)
        })
    }
}
