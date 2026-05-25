/**
 * @author Patrik Gfeller - Initial contribution
 */

import fetchMock from 'jest-fetch-mock'
fetchMock.enableMocks()

import { window } from 'vscode'

// Mock modules that Utils imports
jest.mock('../src/Utils/ConfigManager', () => ({
    ConfigManager: {
        get: jest.fn((key: string) => {
            if (key === 'connection.host') return 'localhost'
            if (key === 'connection.port') return 8080
            return null
        }),
        update: jest.fn(),
        tokenAuthAvailable: jest.fn(() => false),
    },
}))
jest.mock('../src/WebViews/PreviewPanel', () => ({
    PreviewPanel: { createOrShow: jest.fn() },
}))

import { getSitemaps, handleRequestError } from '../src/Utils/Utils'

beforeEach(() => {
    fetchMock.resetMocks()
    jest.clearAllMocks()
})

describe('getSitemaps()', () => {
    test('resolves with the response data array on success', () => {
        const data = [{ name: 'default' }, { name: 'rooms' }]
        fetchMock.mockResponseOnce(JSON.stringify(data))

        return getSitemaps().then((result: any) => {
            expect(result).toEqual(data)
        })
    })

    test('rejects with an empty array on fetch failure', () => {
        fetchMock.mockRejectOnce(new Error('Network error'))

        return expect(getSitemaps()).rejects.toEqual([])
    })
})

describe('handleRequestError()', () => {
    test('calls showErrorMessage with the base message', () => {
        const showErrorMessage = window.showErrorMessage as jest.Mock
        showErrorMessage.mockResolvedValue(undefined)

        return handleRequestError(new Error('connection refused')).then(() => {
            expect(showErrorMessage).toHaveBeenCalledTimes(1)
            expect(showErrorMessage.mock.calls[0][0]).toContain('Error while connecting to openHAB REST API.')
        })
    })

    test('uses err.message when error is an Error instance', () => {
        const showErrorMessage = window.showErrorMessage as jest.Mock
        showErrorMessage.mockResolvedValue(undefined)

        // When given an Error instance, handleRequestError should base the message on err.message
        const err = new Error('timeout occurred')
        return handleRequestError(err).then(() => {
            expect(showErrorMessage).toHaveBeenCalledTimes(1)
        })
    })

    test('does not throw when err has no message property', () => {
        const showErrorMessage = window.showErrorMessage as jest.Mock
        showErrorMessage.mockResolvedValue(undefined)

        return expect(handleRequestError({ code: 500 })).resolves.toBeUndefined()
    })
})
