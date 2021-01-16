import {
    commands,
    Uri,
    window,
    workspace
} from 'vscode'
import { Thing } from './Thing'
import { Channel } from './Channel'
import * as utils from '../Utils'

import * as _ from 'lodash'
import * as request from 'request-promise-native'


/**
 * Collects Things in JSON format from REST API
 * and transforms it into sorted tree
 *
 * @author Kuba Wolanin - Initial contribution
 */
export class ThingsModel {

    constructor() {
    }

    /**
     * Returns all Things
     */
    public get roots(): Thenable<Thing[]> {
        return this.sendRequest(null, (things: Thing[]) => {
            return things.map(thing => new Thing(thing))
        })
    }

    /**
     * Returns members of Group-type Item
     * @param thing openHAB root Item
     */
    public getChildren(thing: Thing): Channel[] | any[] {
        return thing.channels ? thing.channels : []
    }

    private sendRequest(uri: string, transform): Thenable<Thing[]> {
        let options = {
            uri: uri || utils.getHost() + '/rest/things',
            json: true,
            encoding: 'utf8'
        }

        return new Promise((resolve, reject) => {
            request(options)
                .then(function (response: Thing[] | Thing) {
                    resolve(this.sort(transform(response)))
                }.bind(this))
                .catch(err => {
                    utils.appendToOutput(`Could not reload items for Things Explorer`)
                    utils.handleRequestError(err).then(err => resolve([]))
                })
        })
    }

    protected sort(nodes: Thing[]): Thing[] {
        return nodes.sort((n1, n2) => {
            if (n1.label && n2.label) {
                return n1.label.localeCompare(n2.label)
            }

            if (n1.UID && n2.UID) {
                return n1.UID.localeCompare(n2.UID)
            }
        })
    }
}
