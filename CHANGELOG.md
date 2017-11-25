# openHAB VS Code Extension Change Log

## 0.3.5 - 2017-11-25
- Fixed issues with non-root workspaces (#62)
- Fixed issues with REST connection (#58)
- Added some Type Conversion snippets (#60)
- Added 'Open Karaf console' feature (#59)
- Optionally open Classic UI for sitemap preview (#54)

## 0.3.0 - 2017-11-15
- Introduced openHAB **Things Explorer** view in the sidebar!
  - Create Items directly from Thing's channels.
  - Quick copy name and Thing UID directly from the sidebar
  - Quick access to the binding documentation
- Insert into Sitemap feature in the openHAB Items view
- Various Language Server Protocol fixes
- New configuration parameters:
  - `restCompletions` - toggles completions from REST API
  - `paperPath` - defaults to `paperui`. Change it to `ui` if you're using from before 9th Jan 2017
  - `paperInBrowser` - if set to `true`, will open Paper UI in a browser instead of VSCode window
  - `lspEnabled` - if `true`, will enable communication with openHAB's Language Server. Note that `misc-lsp` add-on needs to be installed.
  - `lspPort` - defaults to `5007`, custom LSP port parameter (#42)
- Fixed "switch" icon coloring (#18)
- "Set openHAB host" button on error message (#42)
- **Breaking change**: `openhab.port` parameter is now a number (e.g. `8080` instead of `"8080"`).
Please change it in your settings after upgrade.

## 0.2.0 - 2017-10-17
- Language Server Protocol support
- You can now disable REST API connection
- Updated logo icons
- Better error handling
- Fixed REST connection with Basic Authentication
- Paper UI URL is now dynamically detected
- More new snippets

## 0.1.0 - 2017-07-07
- Completely new openHAB Items Explorer view in the sidebar!
    - Preview **all** of your items thanks to the REST API
    - Dynamic rules from the Items Explorer view - including the current state
    - Ability to copy Item's name and state
    - Clicking non-Group item opens it in the Paper UI by default
    - Note: Currently in VS Code stable Items Explorer is permanently visible. VS Code Insiders allows you to hide the tree view thanks to [vscode#29436](https://github.com/Microsoft/vscode/issues/29436) 
- Added Items autocompletion (with IntelliSense documentation) (#7)
- Quick search in the Community Forum
- Added icon theme

## 0.0.2 - 2017-06-21
- openHAB hostname and port are now configurable through user or workspace settings (#14)
- Added "openhab.searchCommunity" action allowing to search selected text in the openHAB Community (#13)
- Minor tweaks in the code and documentation (#6 #13)

## 0.0.1 - 2017-06-19
- Initial release