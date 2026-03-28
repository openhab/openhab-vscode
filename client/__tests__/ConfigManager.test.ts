/**
 * ConfigManager token validation — HTTP status handling only.
 *
 * We test the fetch call behavior inside ConfigManager's onDidChangeConfiguration
 * handler by mocking fetch at the module level and directly invoking the handler
 * via the attachConfigChangeWatcher method.
 *
 * @author Patrik Gfeller - Initial contribution
 */

import fetchMock from 'jest-fetch-mock'
fetchMock.enableMocks()

jest.mock('../src/WebViews/PreviewPanel', () => ({
    PreviewPanel: { createOrShow: jest.fn() }
}))

// Provide a minimal utils mock so ConfigManager can import it
jest.mock('../src/Utils/Utils', () => ({
    getHost: jest.fn(() => 'http://localhost:8080'),
    appendToOutput: jest.fn(),
    handleRequestError: jest.fn(() => Promise.resolve()),
    getOutputChannel: jest.fn(() => ({ show: jest.fn() })),
}))

import { window, workspace } from 'vscode'
import { ConfigManager } from '../src/Utils/ConfigManager'

function makeConfigEvent(key: string) {
    return { affectsConfiguration: (k: string) => k === key }
}

let capturedHandler: ((e: any) => void) | undefined

beforeEach(() => {
    fetchMock.resetMocks()
    jest.clearAllMocks()
        // ConfigManager is a singleton — reset the private instance between tests
        ; (ConfigManager as any).instance = undefined
    capturedHandler = undefined

    // Default workspace.getConfiguration mock: returns a token so tokenAuthAvailable() = true
    const mockConfig = {
        get: jest.fn((key: string, def?: any) => {
            if (key === 'connection.authToken') return 'oh.mytoken.abc'
            if (key === 'connection.host') return 'localhost'
            if (key === 'connection.port') return 8080
            return def !== undefined ? def : null
        }),
        has: jest.fn(() => true),
        update: jest.fn(),
        inspect: jest.fn(() => ({ globalValue: undefined, workspaceValue: undefined }))
    }
        ; (workspace.getConfiguration as jest.Mock).mockReturnValue(mockConfig)

        // Capture the handler that attachConfigChangeWatcher registers
        ; (workspace.onDidChangeConfiguration as jest.Mock).mockImplementation((handler: any) => {
            capturedHandler = handler
            return { dispose: jest.fn() }
        })
})

describe('ConfigManager token validation (HTTP status handling)', () => {
    test('logs success message when HTTP 200', async () => {
        fetchMock.mockResponseOnce(JSON.stringify([]), { status: 200 })

        const { appendToOutput } = require('../src/Utils/Utils')
        ConfigManager.attachConfigChangeWatcher({ subscriptions: { push: jest.fn() } })
        expect(capturedHandler).toBeDefined()

        await capturedHandler!(makeConfigEvent('openhab.connection.authToken'))
        await new Promise(r => setImmediate(r))

        expect(appendToOutput).toHaveBeenCalledWith(expect.stringContaining('validated successfully'))
    })

    test('calls handleConfigError on HTTP 401', async () => {
        fetchMock.mockResponseOnce('Unauthorized', { status: 401 })

        const showError = window.showErrorMessage as jest.Mock
        showError.mockResolvedValue(undefined)

        ConfigManager.attachConfigChangeWatcher({ subscriptions: { push: jest.fn() } })
        await capturedHandler!(makeConfigEvent('openhab.connection.authToken'))
        await new Promise(r => setImmediate(r))

        expect(showError).toHaveBeenCalledWith(
            expect.stringContaining('config validation'),
            expect.any(String)
        )
    })

    test('calls handleRequestError on non-401 HTTP error', async () => {
        fetchMock.mockResponseOnce('Internal Server Error', { status: 500 })

        const { handleRequestError } = require('../src/Utils/Utils')

        ConfigManager.attachConfigChangeWatcher({ subscriptions: { push: jest.fn() } })
        await capturedHandler!(makeConfigEvent('openhab.connection.authToken'))
        await new Promise(r => setImmediate(r))

        expect(handleRequestError).toHaveBeenCalledTimes(1)
    })
})
