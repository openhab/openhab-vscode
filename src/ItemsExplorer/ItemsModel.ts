import { window } from 'vscode'
import { Item } from './Item'

import * as _ from 'lodash'
import * as request from 'request-promise-native'

/**
 * Collects Items in JSON format from REST API
 * and transforms it into sorted tree
 * 
 * Kuba Wolanin - Initial contribution
 */
export class ItemsModel {

    constructor(private host: string) {
    }

    private items: Item[]

    public get roots(): Thenable<Item[]> {
        let options = {
            uri: this.host + '/rest/items',
            json: true
        };

        return new Promise(resolve => {
            request(options)
                .then(function (items) {
                    let itemsMap = items.map(item => new Item(item))
                    let rootItems = _.filter(itemsMap, (item: Item) => item.isRootItem)

                    resolve(this.sort(rootItems))
                }.bind(this))
                .catch(err => {
                    window.showErrorMessage('Error while connecting: ' + err.message);
                });
        })
    }

    public getChildren(item: Item): Thenable<Item[]> {
        let options = {
            uri: this.host + item.path,
            json: true
        };

        return new Promise(resolve => {
            request(options)
                .then(function (items) {
                    let itemsMap = items.members.map(item => new Item(item))
                    resolve(this.sort(itemsMap))
                }.bind(this))
                .catch(err => {
                    window.showErrorMessage('Error while connecting: ' + err.message);
                });
        })
    }

    protected sort(nodes: Item[]): Item[] {
        return nodes.sort((n1, n2) => {
            if (n1.isGroup && !n2.isGroup) {
                return -1;
            }

            if (!n1.isGroup && n2.isGroup) {
                return 1;
            }

            return n1.name.localeCompare(n2.name);
        });
    }
}
