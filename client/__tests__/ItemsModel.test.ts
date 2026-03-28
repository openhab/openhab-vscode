/**
 * @author Patrik Gfeller - Initial contribution
 */

import fetchMock from 'jest-fetch-mock'
fetchMock.enableMocks()

jest.mock('../src/Utils/ConfigManager', () => ({
    ConfigManager: {
        get: jest.fn(() => null),
        tokenAuthAvailable: jest.fn(() => false),
    }
}))
jest.mock('../src/WebViews/PreviewPanel', () => ({
    PreviewPanel: { createOrShow: jest.fn() }
}))
jest.mock('../src/Utils/Utils', () => ({
    getHost: jest.fn(() => 'http://localhost:8080'),
    appendToOutput: jest.fn(),
    handleRequestError: jest.fn(() => Promise.resolve()),
}))

import { ItemsModel } from '../src/ItemsExplorer/ItemsModel'

beforeEach(() => {
    fetchMock.resetMocks()
    jest.clearAllMocks()
})

describe('ItemsModel.roots', () => {
    test('resolves with root items (items without a group) on success', async () => {
        fetchMock.mockResponseOnce(JSON.stringify([
            { name: 'Standalone_Item', type: 'Switch', state: 'OFF', groupNames: [], label: '' },
            { name: 'Grouped_Item', type: 'Switch', state: 'ON', groupNames: ['gAll'], label: '' },
        ]))

        const model = new ItemsModel()
        const roots = await model.roots
        // Only the item without a group is a root item
        expect(roots.length).toBe(1)
        expect(roots[0].name).toBe('Standalone_Item')
    })

    test('resolves with an empty array and calls error handler on failure', async () => {
        const { handleRequestError } = require('../src/Utils/Utils')
        fetchMock.mockRejectOnce(new Error('connection refused'))

        const model = new ItemsModel()
        const roots = await model.roots
        expect(roots).toEqual([])
        expect(handleRequestError).toHaveBeenCalledTimes(1)
    })
})

describe('ItemsModel.getChildren()', () => {
    test('resolves with member items of a Group item', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({
            name: 'gAll', type: 'Group', state: 'ON', groupNames: [], label: '',
            members: [
                { name: 'Child_A', type: 'Switch', state: 'OFF', groupNames: ['gAll'], label: '' }
            ]
        }))

        const model = new ItemsModel()
        const { Item } = require('../src/ItemsExplorer/Item')
        const parentItem = new Item({ name: 'gAll', type: 'Group', state: 'ON', groupNames: [], label: '', members: [] })
        const children = await model.getChildren(parentItem)
        expect(children.length).toBe(1)
        expect(children[0].name).toBe('Child_A')
    })
})
