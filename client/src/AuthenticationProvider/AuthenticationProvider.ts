import * as vscode from 'vscode';
import {
    authentication,
    AuthenticationProvider,
    AuthenticationProviderAuthenticationSessionsChangeEvent,
    AuthenticationSession,
    Event,
    EventEmitter
} from 'vscode'
import { v4 as uuid } from 'uuid';
import {
    getHost,
    PromiseAdapter,
    promiseFromEvent
} from '../Utils/Utils';
import axios, { AxiosRequestConfig } from 'axios';

function parseQuery(uri: vscode.Uri) {
    return uri.query.split('&').reduce((prev: any, current) => {
        const queryString = current.split('=');
        prev[queryString[0]] = queryString[1];
        return prev;
    }, {});
}


class UriEventHandler extends vscode.EventEmitter<vscode.Uri> implements vscode.UriHandler {
    public handleUri(uri: vscode.Uri) {
        this.fire(uri);
    }
}

export const uriHandler = new UriEventHandler;

export class OHAuthenticationProvider implements AuthenticationProvider {
    private _emitter = new EventEmitter<AuthenticationProviderAuthenticationSessionsChangeEvent>()
    private context: vscode.ExtensionContext
    private _pendingStates = new Map<string[], string[]>();

    constructor(context: vscode.ExtensionContext) {
        this.context = context
    }

    onDidChangeSessions: Event<AuthenticationProviderAuthenticationSessionsChangeEvent> = this._emitter.event

    public async getSessions(scopes?: string[]): Promise<readonly AuthenticationSession[]> {
        const refreshToken = await this.context.secrets.get('openhab.refreshToken')
        const clientId = await this.context.secrets.get('openhab.clientId')
        const host = getHost()
        if (clientId && refreshToken) {
            const tokenUrl = `${host}/rest/auth/token`
            let config: AxiosRequestConfig = {
                url: host + '/rest/auth/token',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: `grant_type=refresh_token&client_id=${encodeURIComponent(clientId.replace('?', '%3F'))}&redirect_uri=${encodeURIComponent(clientId.replace('?', '%3F'))}&refresh_token=${refreshToken}`
            }

            const result = await axios(config)
            console.info('Token refresh success!')

            return Promise.resolve([{
                id: host,
                account: {
                    label: 'openHAB',
                    id: host
                },
                scopes: ['admin'],
                accessToken: result.data.access_token
            }])
        } else {
            return Promise.resolve([])
        }
    }

    public async createSession(scopes: string[]): Promise<AuthenticationSession> {
        const callbackUri = await vscode.env.asExternalUri(vscode.Uri.parse(`${vscode.env.uriScheme}://openhab.openhab/auth`))
        const host = getHost()

        const state = uuid();
        const existingStates = this._pendingStates.get(scopes) || [];
        this._pendingStates.set(scopes, [...existingStates, state]);

        const uri = vscode.Uri.parse(`${host}/auth?response_type=code&client_id=${encodeURIComponent(callbackUri.toString())}&redirect_uri=${encodeURIComponent(callbackUri.toString())}&scope=admin&state=${state}`);
        await vscode.env.openExternal(uri);

        let codeExchangePromise = promiseFromEvent(uriHandler.event, this.exchangeCodeForToken(host, callbackUri.toString(), callbackUri.toString(), scopes))

        return codeExchangePromise.promise.then((accessToken) => {
            return Promise.resolve({
                id: host,
                account: {
                    label: 'openHAB',
                    id: host
                },
                scopes: ['admin'],
                accessToken: accessToken
            })
        })
    }

    public async removeSession(sessionId: string): Promise<void> {
        return Promise.all([
            this.context.secrets.delete('openhab.refreshToken'),
            this.context.secrets.delete('openhab.clientId')
        ]).then(() => Promise.resolve())
    }

    private exchangeCodeForToken: (host: string, clientId: string, callbackUri: string, scopes: string[]) => PromiseAdapter<vscode.Uri, string> =
        (host, clientId, callbackUri, scopes) => async (uri, resolve, reject) => {
            const query = parseQuery(uri)
            const code = query.code
            const acceptedStates = this._pendingStates.get(scopes) || []
            if (!acceptedStates.includes(query.state)) {
                reject('Received mismatched state')
                return
            }

            try {
                const tokenUrl = `${host}/rest/auth/token`
                let config: AxiosRequestConfig = {
                    url: host + '/rest/auth/token',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    data: `grant_type=authorization_code&client_id=${encodeURIComponent(clientId.replace('?', '%3F'))}&redirect_uri=${encodeURIComponent(callbackUri.replace('?', '%3F'))}&code=${code}`
                }
                console.debug(`Exchanging token: calling token endpoint with ${config.data}`)
                const result = await axios(config)
                console.info('Token exchange success!')
                console.info('Saving refresh_token in keychain')
                this.context.secrets.store('openhab.refreshToken', result.data.refresh_token)
                this.context.secrets.store('openhab.clientId', clientId)
                resolve(result.data.access_token)
            } catch (ex) {
                reject(ex);
            }
        }
}
