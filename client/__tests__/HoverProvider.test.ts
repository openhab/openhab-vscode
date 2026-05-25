/**
 * @author Patrik Gfeller - Initial contribution
 */

import fetchMock from 'jest-fetch-mock'
fetchMock.enableMocks()

import { Hover } from 'vscode'

jest.mock('../src/Utils/ConfigManager', () => ({
    ConfigManager: {
        get: jest.fn(() => null),
        tokenAuthAvailable: jest.fn(() => false),
    },
}))
jest.mock('../src/WebViews/PreviewPanel', () => ({
    PreviewPanel: { createOrShow: jest.fn() },
}))
jest.mock('../src/Utils/Utils', () => ({
    getHost: jest.fn(() => 'http://localhost:8080'),
    appendToOutput: jest.fn(),
    handleRequestError: jest.fn(() => Promise.resolve()),
}))

import { HoverProvider } from '../src/HoverProvider/HoverProvider'

beforeEach(() => {
    fetchMock.resetMocks()
    jest.clearAllMocks()
})

describe('HoverProvider.getRestItemHover()', () => {
    test('resolves a Hover with item state for a regular item', () => {
        // First response: updateItems() in constructor; second: getRestItemHover()
        fetchMock.mockResponseOnce(JSON.stringify([{ name: 'Kitchen_Light' }]))
        fetchMock.mockResponseOnce(JSON.stringify({ name: 'Kitchen_Light', type: 'Switch', state: 'ON' }))

        const provider = new HoverProvider()
        // updateItems() fires in constructor — let it settle
        return new Promise((r) => setImmediate(r))
            .then(() => (provider as any).getRestItemHover('Kitchen_Light'))
            .then((result: any) => {
                expect(result).toBeInstanceOf(Hover)
            })
    })

    test('resolves a Hover listing members for a Group item', () => {
        // First response: updateItems() in constructor; second: getRestItemHover()
        fetchMock.mockResponseOnce(JSON.stringify([{ name: 'gLights' }]))
        fetchMock.mockResponseOnce(
            JSON.stringify({
                name: 'gLights',
                type: 'Group',
                state: 'ON',
                members: [
                    { name: 'Kitchen_Light', state: 'ON' },
                    { name: 'Living_Light', state: 'OFF' },
                ],
            })
        )

        const provider = new HoverProvider()
        return new Promise((r) => setImmediate(r))
            .then(() => (provider as any).getRestItemHover('gLights'))
            .then((result: any) => {
                expect(result).toBeInstanceOf(Hover)
            })
    })

    test('rejects with false on fetch error', () => {
        // updateItems() succeeds; getRestItemHover() rejects
        fetchMock.mockResponseOnce(JSON.stringify([]))
        fetchMock.mockRejectOnce(new Error('not found'))

        const provider = new HoverProvider()
        return new Promise((r) => setImmediate(r)).then(() =>
            expect((provider as any).getRestItemHover('Unknown_Item')).rejects.toBe(false)
        )
    })
})

describe('HoverProvider.updateItems()', () => {
    test('populates knownItems with item names on success', () => {
        fetchMock.mockResponseOnce(JSON.stringify([{ name: 'Item_A' }, { name: 'Item_B' }]))

        const provider = new HoverProvider()
        // Wait for the constructor's updateItems() to complete
        return new Promise((r) => setImmediate(r)).then(() => {
            expect((provider as any).knownItems).toEqual(['Item_A', 'Item_B'])
        })
    })

    test('calls handleRequestError on fetch failure', () => {
        const { handleRequestError } = require('../src/Utils/Utils')
        fetchMock.mockRejectOnce(new Error('network error'))

        const provider = new HoverProvider()
        return new Promise((r) => setImmediate(r)).then(() => {
            expect(handleRequestError).toHaveBeenCalledTimes(1)
            expect((provider as any).knownItems).toEqual([])
        })
    })
})
