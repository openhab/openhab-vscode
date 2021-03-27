import * as vscode from "vscode";
import { getNonce } from "../getNonce";


export class UpdateNoticePanel {
  /**
   * Track the currently panel. Only allow a single panel to exist at a time.
   */
  public static currentPanel: UpdateNoticePanel | undefined;

  public static readonly viewType = "updatenotice";

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it.
    if (UpdateNoticePanel.currentPanel) {
      UpdateNoticePanel.currentPanel._panel.reveal(column);
      UpdateNoticePanel.currentPanel._update();
      return;
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      UpdateNoticePanel.viewType,
      "Update Notice",
      column || vscode.ViewColumn.One,
      {
        // Enable javascript in the webview
        enableScripts: true,

        // And restrict the webview to only loading content from our extension's `media` directory.
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, "media"),
          vscode.Uri.joinPath(extensionUri, "out/compiled"),
        ],
      }
    );

    UpdateNoticePanel.currentPanel = new UpdateNoticePanel(panel, extensionUri);
  }

  public static kill() {
    UpdateNoticePanel.currentPanel?.dispose();
    UpdateNoticePanel.currentPanel = undefined;
  }

  public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    UpdateNoticePanel.currentPanel = new UpdateNoticePanel(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // // Handle messages from the webview
    // this._panel.webview.onDidReceiveMessage(
    //   (message) => {
    //     switch (message.command) {
    //       case "alert":
    //         vscode.window.showErrorMessage(message.text);
    //         return;
    //     }
    //   },
    //   null,
    //   this._disposables
    // );
  }

  public dispose() {
    UpdateNoticePanel.currentPanel = undefined;

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private async _update() {
    const webview = this._panel.webview;

    this._panel.webview.html = this._getHtmlForWebview(webview);
    webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "onInfo": {
          if (!data.value) {
            return;
          }
          vscode.window.showInformationMessage(data.value);
          break;
        }
        case "onError": {
          if (!data.value) {
            return;
          }
          vscode.window.showErrorMessage(data.value);
          break;
        }
      }
    })
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // // And the uri we use to load this script in the webview
    // const scriptUri = webview.asWebviewUri(
    //   vscode.Uri.joinPath(this._extensionUri, "out", "compiled/updatenotice.js")
    // );

    // Uri to load styles into webview
    const stylesResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "reset.css" )
    )

    const stylesMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
    )

    // Use a nonce to only allow specific scripts to be run
    const nonce = getNonce();

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
        -->
        <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${
      webview.cspSource
    }; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${stylesResetUri}" rel="stylesheet">
				<link href="${stylesMainUri}" rel="stylesheet">
        <style>
          body {
            padding: 10px 20px;
            max-width: 882px;
            margin: 0 auto;
            line-height: 22px;
          }
        </style>
			</head>
      <body>
      <h1>openHAB Extension: Update Notice</h1>
      <p><img src="https://raw.githubusercontent.com/openhab/openhab-vscode/main/images/oh_color.svg"/></p>
      <h2>openHAB Extension has been updated to version: <i>1.0.0</i></h2>
      <br/>
      <p>The currently installed update has some significant changes.</p>
      <p>Some of them are <b>breaking changes</b> and you have to to take care manually of those.</p>
      <br/>
      <p>Please have a look at the <a href="https://github.com/openhab/openhab-vscode/releases/latest" target="_blank">Latest Release information</a> where we will provide further instructions on breaking changes.
      <br/>
      <br/>
      <p>You can also check the <a href="https://community.openhab.org/c/apps-services/vs-code/54" target="_blank">vscode area</a> in our <a href="https://community.openhab.org/" target="_blank">community forum</a> for news, questions and discussions about the openHAB extension.</p>
      </body>
			</html>`;
  }
}
