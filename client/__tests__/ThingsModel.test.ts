/**
 * @author Patrik Gfeller - Initial contribution
 */

import fetchMock from 'jest-fetch-mock'
fetchMock.enableMocks()

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

import { ThingsModel } from '../src/ThingsExplorer/ThingsModel'

beforeEach(() => {
    fetchMock.resetMocks()
    jest.clearAllMocks()
})

describe('ThingsModel.roots', () => {
    test('resolves with sorted things on success', () => {
        fetchMock.mockResponseOnce(
            JSON.stringify([
                { UID: 'mqtt:broker:mybroker', label: 'MQTT Broker', channels: [] },
                { UID: 'astro:sun:local', label: 'Astro Sun', channels: [] },
            ])
        )

        const model = new ThingsModel()
        return model.roots.then((roots: any[]) => {
            expect(roots.length).toBe(2)
            // Should be sorted alphabetically by label
            expect(roots[0].label).toBe('Astro Sun')
            expect(roots[1].label).toBe('MQTT Broker')
        })
    })

    test('resolves with an empty array and calls error handler on failure', () => {
        const { handleRequestError } = require('../src/Utils/Utils')
        fetchMock.mockRejectOnce(new Error('network error'))

        const model = new ThingsModel()
        return model.roots.then((roots: any[]) => {
            expect(roots).toEqual([])
            expect(handleRequestError).toHaveBeenCalledTimes(1)
        })
    })
})
