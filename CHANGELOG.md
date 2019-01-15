# openHAB VS Code Extension Change Log

## 0.5.0 - TBD
- Added local LSP server (#122)
- Fixed sorting order in items explorer (#125)
- removed settings param 'restCompletions'
- renamed settings param 'lspEnabled' to 'remoteLspEnabled'
- renamed settings param 'lspPort' to 'remoteLspPort'
- added settings param 'itemCasing' to allow for Item format configuration (#133)
- removed reference to library 'underscore.string' (#133)

## 0.4.1 - 2018-12-09
- Fixed Basic UI Preview (#117)
- Fixed Show in Paper UI command (#117)
- Clarified 'restCompletions' configuration description (#117)
- Added 'simple mode check' for show in Paper UI command (#117)
- Removed 'searchDocs' command, since it doesn't work with the new website (#117)
- Removed sorting of items for auto completion (#114)
- Move openHAB tree views to a ViewContainer (#107)
- Remove the unused imports (#106)
- Open Sitemap directly if there is only one (#104)
- Added Units of Measurement (#103) (#105)
- Added extensions.json file (#101)
- Update documentation link (#96)
- Snippert improvements (#91)
- Added item autocompletion snippets (#90)
- Snippet file refactoring. (#77)
- Fixed file extension checks (#76) 
- [Type Conversions]Several small fixes (#72)
- REST Configuration fix (#68)
- Added missing images (#65) 

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