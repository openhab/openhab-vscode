import {
    CancellationToken,
    Event,
    EventEmitter,
    TextDocumentContentProvider,
    Uri
} from 'vscode'
import defaults = require('lodash/defaults')

export const SCHEME = 'openHAB'

const DEFAULT_QUERY: Query = {
    hostname: 'localhost',
    route: '/basicui/app'
}

function applyDefaultsToQuery(query: Query) {
    return defaults({}, query, DEFAULT_QUERY)
}

export interface Query {
    hostname?: string
    route?: string
}

export function encodeOpenHABUri(query?: Query): Uri {
    return Uri.parse(`${SCHEME}://search?${JSON.stringify(applyDefaultsToQuery(query))}`)
}

export function decodeOpenHABUri(uri: Uri): Query {
    return <Query>JSON.parse(uri.query)
}

const HTML_CONTENT = (query: Query) => `
<style>
body {
    margin: 0;
    padding: 0;
    background: #fff;
}
iframe {
    position: absolute;
    border: none;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
}
</style>

<body>
    <iframe src="${query.hostname}${query.route}">
    </iframe>
</body>
`

export class OpenHABContentProvider implements TextDocumentContentProvider {
    private _onDidChange = new EventEmitter<Uri>()

    get onDidChange(): Event<Uri> {
        return this._onDidChange.event
    }

    public update(uri: Uri) {
        this._onDidChange.fire(uri)
    }

    provideTextDocumentContent(uri: Uri, token: CancellationToken): string | Thenable<string> {
        return HTML_CONTENT(decodeOpenHABUri(uri))
    }
}
