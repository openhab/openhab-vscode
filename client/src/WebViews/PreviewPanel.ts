import * as path from 'path'
import * as vscode from 'vscode'
import { appendToOutput } from "../Utils/Utils"
import { getNonce } from './getNonce'
/**
 * Manages the extension WebView panel
 *
 * Reference implementation accessable through
 * https://github.com/Microsoft/vscode-extension-samples/tree/master/webview-sample
 *
 * @author Jerome Luckenbach - Initial contribution
 */
export class PreviewPanel {

     /**
     * Track the current panel. Only allow a single panel to exist at a time.
     */
    public static currentPanel: PreviewPanel | undefined
    public static readonly viewType = 'ohPreviewPanel'

    private static _lastUrl : string | undefined

    private readonly _panel: vscode.WebviewPanel
    private readonly _extensionPath: string
    private _disposables: vscode.Disposable[] = []

    public static createOrShow(extensionPath: string, title? : string, url? : string) {
        if(title === undefined){
            title = "openHAB Preview"
        }

        // If we already have a panel, show it.
        if (PreviewPanel.currentPanel) {
            appendToOutput(`There is already a preview panel existing. Revealing it.`)
            PreviewPanel.currentPanel._panel.reveal(vscode.ViewColumn.Two)

            // Update panel too, if an url was passed
            if(url !== undefined && url !== PreviewPanel._lastUrl){
                appendToOutput(`Updating existing preview panel now...`)
                PreviewPanel.currentPanel._update(title, url)
                PreviewPanel._lastUrl = url
            }

            return
        }

        // Otherwise, create a new panel.
        appendToOutput(`Creating new preview panel.`)
        const panel = vscode.window.createWebviewPanel(PreviewPanel.viewType, title, vscode.ViewColumn.Two, {
            // Enable javascript in the webview
            enableScripts: true
        })

        PreviewPanel.currentPanel = new PreviewPanel(panel, extensionPath, title)

        // Update panel too, if an url was passed
        if(url !== undefined){
            appendToOutput(`Updating new preview panel now...`)
            PreviewPanel.currentPanel._update(title, url)
            PreviewPanel._lastUrl = url
        }
    }

    public static revive(panel: vscode.WebviewPanel, extensionPath: string, title : string = "openHAB Preview") {
        PreviewPanel.currentPanel = new PreviewPanel(panel, extensionPath, title)
    }

    private constructor(panel: vscode.WebviewPanel, extensionPath: string, title : string) {
        this._panel = panel
        this._extensionPath = extensionPath

        // Set the webview's initial html content
        this._update(title)

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables)

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'alert':
                    vscode.window.showErrorMessage(message.text)
                    return
            }
        }, null, this._disposables)
    }

    public doRefactor() {
        // Send a message to the webview.
        // You can send any JSON serializable data.
        this._panel.webview.postMessage({ command: 'refactor' })
    }

    // Idea: doRefresh method here for auto updating on save

    public dispose() {
        PreviewPanel.currentPanel = undefined

        // Clean up our resources
        this._panel.dispose()

        while (this._disposables.length) {
            const x = this._disposables.pop()
            if (x) {
                x.dispose()
            }
        }
    }

    private _update(title : string, src? : string) {

        if(src === undefined && PreviewPanel._lastUrl === undefined){
            this._panel.webview.html = this._getHtmlForInit(title)
            return
        }

        if(src === undefined){
            src = PreviewPanel._lastUrl
        }

        this._panel.webview.html = this._getHtmlForWebview(title, src)
        return

    }

    private _getHtmlForInit(title : string){

        // Local path to svg logo
        const imagePath = vscode.Uri.file(path.join(this._extensionPath, 'images', 'oh_color.svg'))
        const imageUri = imagePath.with({ scheme: 'vscode-resource' })

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${title}</title>
                <style>
                    body {
                        width: 100%;
                        height: 100%;
                        margin: 0;
                        padding: 0;
                    }
                </style>
            </head>
            <body>
                <h1>openHAB Extension</h1>
                <img src="${imageUri}" alt="openHAB Logo" width="600" height="350"/>
                <p>
                    For more information have a look at <a href="https://github.com/openhab/openhab-vscode">Github</a> or <a href="https://www.openhab.org/docs/configuration/editors.html#openhab-vs-code-extension">openHAB Docs</a>.
                    </ul>
                </p>
            </body>
            </html>`
    }

    private _getHtmlForWebview(title : string, src : string) {

        // Use a nonce to whitelist which scripts can be run
        const nonce = getNonce()

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">

                <!--
                Use a content security policy to only allow scripts that have a specific nonce.
                -->
                <meta http-equiv="Content-Security-Policy" script-src 'nonce-${nonce}';">

                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${title}</title>
                <style>
                    body {
                        width: 100%;
                        height: 100%;
                        margin: 0;
                        padding: 0;
                    }
                    iframe {
                        position: absolute;
                        border: none;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                        <!--
                        width: 100%;
                        min-height:900px;
                        border: none;
                        margin: 0;
                        padding: 0;
                        display: block;
                        -->
                    }
                </style>
            </head>
            <body>
                <iframe src="${src}"></iframe>
            </body>
            </html>`

    }

}
