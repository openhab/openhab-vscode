import * as vscode from 'vscode'
import * as utils from '../Utils/Utils'
import axios, { AxiosRequestConfig } from 'axios'

const SCHEMA = "openhab"

const itemsSchema = JSON.stringify({
    '$schema': 'https://json-schema.org/draft/2020-12/schema',
    '$id': 'openhab:/schemas/items.json',
    title: 'Item',
    properties: {
        name: {
            description: 'The name of the item',
            type: 'string'
        },
        'label': {
            description: 'The label of the item',
            type: 'string'
        },
        'type': {
            description: 'The type of the item',
            type: 'string',
            enum: ['Switch', 'Contact', 'String', 'Number', 'Dimmer', 'DateTime', 'Color', 'Image', 'Player', 'Location', 'Rollershutter', 'Call', 'Group']
        },
    },
    required: ['name', 'type']
})

export class OHJSONSchemaProvider {
    public async initialize() {
        try {
            const yamlExtensionAPI = await vscode.extensions.getExtension("redhat.vscode-yaml").activate()
            yamlExtensionAPI.registerContributor(SCHEMA, this.onRequestSchemaURI, this.onRequestSchemaContent)
        } finally {

        }
    }

    public onRequestSchemaURI(resource: string) {
        const parsedUri = vscode.Uri.parse(resource)
        if (parsedUri.path.startsWith('/items')) {
            return `${SCHEMA}://schemas/items.json`
        } else if (parsedUri.path.startsWith('/things')) {
            const uid = parsedUri.path.replace(/^\/things\//, '').replace(/\.yaml$/, '')
            return `${SCHEMA}://schemas/thing-types/${uid.split(':')[0] + ':' + uid.split(':')[1]}.json`
        }
    }

    public onRequestSchemaContent(schemaUri: string): Promise<string> {
        const parsedUri = vscode.Uri.parse(schemaUri)
        if (parsedUri.scheme !== SCHEMA) {
            return Promise.reject()
        }
        if (!parsedUri.path || !parsedUri.path.startsWith('/')) {
            return Promise.reject()
        }

        if (parsedUri.authority === 'schemas' && parsedUri.path === '/items.json') {
            return Promise.resolve(itemsSchema)
        }

        if (parsedUri.authority === 'schemas' && parsedUri.path.startsWith('/thing-types')) {
            const thingTypeUID = parsedUri.path.replace(/^\/thing-types\//, '').replace(/\.json$/, '')
            const schema = {
                '$schema': 'https://json-schema.org/draft/2020-12/schema',
                '$id': `openhab:/schemas/thing-types/${thingTypeUID}.json`,
                properties: {
                    UID: {
                        description: 'The UID of the thing',
                        type: 'string'
                    },
                    thingTypeUID: {
                        description: 'The thing type UID of the thing',
                        type: 'string'
                    },
                    label: {
                        description: 'The label of the thing',
                        type: 'string'
                    },
                    bridgeUID: {
                        description: 'The UID of the parent bridge the thing is attached to',
                        type: 'string'
                    },
                    configuration: {
                        description: 'The thing configuration',
                        properties: {}
                    }
                },
                require: ['UID', 'thingTypeUID', 'label', 'configuration']
            }

            let config: AxiosRequestConfig = {
                url: utils.getHost() + '/rest/thing-types/' + thingTypeUID,
                headers: {}
            }

            return axios(config).then((result) => {
                result.data.configParameters.forEach((p) => {
                    schema.properties.configuration.properties[p.name] = {
                        title: p.label,
                        description: p.description
                    }
                })

                return Promise.resolve(JSON.stringify(schema))
            })
        }

        return Promise.reject()
    }
}
