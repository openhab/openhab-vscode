/**
 * @author Patrik Gfeller - Initial contribution
 */

import { ThingsExplorer } from '../src/ThingsExplorer/ThingsExplorer'
import { THING_TEMPLATE } from '../src/ThingsExplorer/ItemsProvider'
import { Thing } from '../src/ThingsExplorer/Thing'
import { Channel } from '../src/ThingsExplorer/Channel'

jest.mock('ascii-table', () => {
    class MockAsciiTable {
        private rows: any[][] = []
        addRowMatrix(rows: any[][]): this { this.rows = rows; return this }
        removeBorder(): this { return this }
        toString(): string { return this.rows.map((r: any[]) => r.join(' ')).join('\n') }
    }
    // __importStar returns a module with __esModule:true as-is (keeps it constructable)
    Object.defineProperty(MockAsciiTable, '__esModule', { value: true })
    return MockAsciiTable
})

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

describe('THING_TEMPLATE — regression: lodash chain via _.chain()', () => {
    test('returns a SnippetString when thing has STATE channels', () => {
        const thing = new Thing({
            UID: 'zwave:device:controller:node5',
            label: 'Living Room Dimmer',
            channels: [
                new Channel({
                    uid: 'zwave:device:controller:node5:switch_dimmer',
                    id: 'switch_dimmer',
                    label: 'Dimmer',
                    itemType: 'Dimmer',
                    kind: 'STATE',
                    linkedItems: []
                })
            ],
            statusInfo: { status: 'ONLINE', statusDetail: '' }
        })
        // If lodash is incorrectly used as `_(...)`, TypeScript compilation fails (TS2349)
        // and at runtime it would throw. This test verifies _.chain() works correctly.
        expect(() => THING_TEMPLATE(thing)).not.toThrow()
        const snippet = THING_TEMPLATE(thing)
        expect(snippet).toBeDefined()
        expect(snippet.value).toContain('Dimmer')
    })

    test('skips TRIGGER channels and only processes STATE channels', () => {
        const thing = new Thing({
            UID: 'zwave:device:controller:node5',
            label: 'Smart Plug',
            channels: [
                new Channel({
                    uid: 'zwave:device:controller:node5:scene_number',
                    id: 'scene_number',
                    label: 'Scene',
                    itemType: 'Number',
                    kind: 'TRIGGER',
                    linkedItems: []
                }),
                new Channel({
                    uid: 'zwave:device:controller:node5:switch_binary',
                    id: 'switch_binary',
                    label: 'Switch',
                    itemType: 'Switch',
                    kind: 'STATE',
                    linkedItems: []
                })
            ],
            statusInfo: { status: 'ONLINE', statusDetail: '' }
        })
        const snippet = THING_TEMPLATE(thing)
        expect(snippet.value).toContain('Switch')
        expect(snippet.value).not.toContain('Scene')
    })
})
