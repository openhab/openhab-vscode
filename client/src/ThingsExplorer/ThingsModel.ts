import { Thing } from './Thing'
import { Channel } from './Channel'
import * as utils from '../Utils/Utils'

import * as _ from 'lodash'
import axios, { AxiosRequestConfig } from 'axios'
import { ConfigManager } from '../Utils/ConfigManager'
import { OH_CONFIG_PARAMETERS } from '../Utils/types'


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
        let config: AxiosRequestConfig = {
            url: uri || utils.getHost() + '/rest/things',
            headers: {}
        }

        if(ConfigManager.tokenAuthAvailable()){
            config.headers = {
                'X-OPENHAB-TOKEN': ConfigManager.get(OH_CONFIG_PARAMETERS.connection.authToken)
            }
        }

        return new Promise((resolve, reject) => {
            axios(config)
            .then(function (response) {
                resolve(this.sort(transform(response.data as Thing[] | Thing)))
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
