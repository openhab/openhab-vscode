/**
 * @author Patrik Gfeller - Initial contribution
 */

import { ThingsExplorer } from '../src/ThingsExplorer/ThingsExplorer'
import { Thing } from '../src/ThingsExplorer/Thing'
import { Channel } from '../src/ThingsExplorer/Channel'

describe('ThingsExplorer.getTreeItem() — Thing', () => {
    let explorer: ThingsExplorer

    beforeEach(() => {
        explorer = new ThingsExplorer()
    })

    test('sets description to UID for a Thing', () => {
        const thing = new Thing({
            UID: 'mqtt:broker:mybroker',
            label: 'MQTT Broker',
            channels: [],
            statusInfo: { status: 'ONLINE', statusDetail: '' }
        })
        const treeItem = explorer.getTreeItem(thing)
        expect(treeItem.description).toBe('mqtt:broker:mybroker')
    })

    test('uses label as display label for a Thing', () => {
        const thing = new Thing({
            UID: 'astro:sun:local',
            label: 'Astro Sun',
            channels: [],
            statusInfo: { status: 'ONLINE', statusDetail: '' }
        })
        const treeItem = explorer.getTreeItem(thing)
        expect(treeItem.label).toBe('Astro Sun')
    })

    test('falls back to UID when label is absent for a Thing', () => {
        const thing = new Thing({
            UID: 'astro:sun:local',
            label: undefined,
            channels: [],
            statusInfo: { status: 'OFFLINE', statusDetail: '' }
        })
        const treeItem = explorer.getTreeItem(thing)
        expect(treeItem.label).toBe('astro:sun:local')
    })
})

describe('ThingsExplorer.getTreeItem() — Channel', () => {
    let explorer: ThingsExplorer

    beforeEach(() => {
        explorer = new ThingsExplorer()
    })

    test('does NOT set description for a Channel', () => {
        const channel = new Channel({
            uid: 'mqtt:broker:mybroker:status',
            id: 'status',
            label: 'Status',
            kind: 'STATE',
            linkedItems: []
        })
        const treeItem = explorer.getTreeItem(channel)
        expect(treeItem.description).toBeUndefined()
    })

    test('uses channel label as display label', () => {
        const channel = new Channel({
            uid: 'mqtt:broker:mybroker:status',
            id: 'status',
            label: 'Status',
            kind: 'STATE',
            linkedItems: []
        })
        const treeItem = explorer.getTreeItem(channel)
        expect(treeItem.label).toBe('Status')
    })
})
