# openHAB VS Code Extension Change Log

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.1] - 2026-02-15

### Added

- **Hover tooltips for JavaScript files**: Item hover tooltips (state lookups from the REST API and events.log) now work in `.js` automation files, not just `.items` and `.rules` files.
- **Hover tooltips for `.items` files**: Hovering over item names in `.items` configuration files also provides live state information from the REST API and log files.
- **Hover tooltips for sitemap files**: Item name hover tooltips work in `.sitemap` files, including `item=<name>` references on widget lines.
- **Key-value state extraction from log lines**: When hovering over a variable name found in events.log or openhab.log, the extension extracts its value from log lines with the format `someitem="state"` and displays just the state in the tooltip (e.g. `eventslog: true`).

### Configuration

Log file paths can be configured via VS Code settings:

- `openhab.log.eventsLogPath` — Path to `events.log` (default: `/opt/openhab/userdata/logs/events.log`)
- `openhab.log.openhabLogPath` — Path to `openhab.log` (default: `/opt/openhab/userdata/logs/openhab.log`)

### Artefact

- [openhab-1.0.1.vsix](https://github.com/s0170071/openhab-vscode/raw/main/openhab-1.0.1.vsix)

## [1.0.0] - 2021-04-12

- Add native token based authentication (#247)
- Refactor configuration entries (#247)
- Remove 3rd Party references and rename console setting (#247)
- Replace deprecated http library (#247)
- Add update notice prepared for loing term usage (#250, #258, #260)
- Remove Changelog from .vscodeignore for better marketplace presentation (#253)
- Dependency update (#254)

## [0.8.2] - 2021-03-19

- Dependency fixes (#239)
- Repository automation (ff9de716cd2473f24d9868fd2d19ebc3f366e7a4)
- Small fixes (#241)
- Improve item hover (#242, #244, #245)

## [0.8.1] - 2021-02-28

### Changed

- Post update (#232)
- Small fixes (#234)
- Refactor config usage (#235)
- Update Dependencies. Switch to @types/vscode. (#236)
- Prepare minor update (#238)

## [0.8.0] - 2021-01-09

### Added

- Add two more precise activation events, based on standard openHAB files (#219)
- Prepare beta extension usage (#218)

### Changed

- Remove classic ui. Fix Markdown errors. (#224)
- Remove jest from root repo dependencies. Only needed for the server package (#226)
- Bump acorn from 5.7.3 to 5.7.4 in /serverJS (#222)
- Update dependencies (#220)
- Remove Paper UI (#217)

### Fixed

- Show icons for rules, scripts, persistance files (#205)
- Fix folder icons (#207)
- Encode username and password to make a valid URI. (#214)

## [0.7.0] - 2020-01-22

### Added

- Automated "Release and publish from CI" Script using GitHub Api (#192)
- Documentation on how to solve SSL issues with rest api. (#196)

### Changed

- Added newly used material icons to notice file (#187)
- HoverProvider: Itemcache is refreshed on save of items files (#189)
- Update to v2 of tasks.json (#190)
- Restrict extension to the last 5 releases of vscode (#190)
- Use next extension relase in package.json for the master branch (#190)
- Small improvements and refactored code comments (#191)
- Updated dependencies (#193)
- Corrected sign-off-statement explanation to get a working DCO Check (#197)

### Fixed

- Fix treeview icons with dynamically generated path (#188)
- Fix generation of minichangelog in build pipeline (#190)
- Solve tslint problems (#191)

## [0.6.0] - 2019-11-13

### Added

- Add hover provider with rest api integration (#146, #178)
- Add/Move to an azure build pipeline environment (#148, #150, #166)
- Add support for webpack (#155)
- Added output channel for better user interaction (#156)
- Add statusbar item, to give a feedback about the extensions activation state (#162)

### Changed

- Added some activation events (#142)
- Update license to EPL-2.0 (#143)
- General `.gitignore` contents (#144)
- Add warning about network paths to remote LSP setting (#147)
- Clean Readme and introduce docs folder (#149)
- Refactor language config files (#154)
- Make TreeView visible when `restApi` is available to benefit from it in `JSR223` developing (#154)
- Made some commands directly accessible in things explorer (#177)

### Fixed

- Fix https lsp problems (#139)
- Fix case insensivity bug (#170)

## [0.5.1] - 2019-05-19

### Fixed

- Hotfix with updated package files

## [0.5.0] - 2019-05-19

### Added

- Added local LSP server (#122)
- added settings param 'itemCasing' to allow for Item format configuration (#133)

### Changed

- Add newline after inserting a new item (#136)

### Deprecated

- renamed settings param 'lspEnabled' to 'remoteLspEnabled'
- renamed settings param 'lspPort' to 'remoteLspPort'

### Removed

- removed settings param 'restCompletions'
- removed reference to library 'underscore.string' (#133)

### Fixed

- Fixed sorting order in items explorer (#125)

## [0.4.1] - 2018-12-09

### Added

- Added missing images (#65)
- Added item autocompletion snippets (#90)
- Added extensions.json file (#101)
- Added Units of Measurement (#103) (#105)
- Added 'simple mode check' for show in Paper UI command (#117)

### Changed

- Snippet file refactoring. (#77)
- Snippert improvements (#91)
- Update documentation link (#96)
- Open Sitemap directly if there is only one (#104)
- Move openHAB tree views to a ViewContainer (#107)
- Clarified 'restCompletions' configuration description (#117)

### Removed

- Remove the unused imports (#106)
- Removed sorting of items for auto completion (#114)
- Removed 'searchDocs' command, since it doesn't work with the new website (#117)

### Fixed

- REST Configuration fix (#68)
- [Type Conversions]Several small fixes (#72)
- Fixed file extension checks (#76)
- Fixed Basic UI Preview (#117)
- Fixed Show in Paper UI command (#117)

## [0.3.5] - 2017-11-25

### Added

- Added some Type Conversion snippets (#60)
- Added 'Open openHAB console' feature (#59)

### Changed

- Optionally open Classic UI for sitemap preview (#54)

### Fixed

- Fixed issues with non-root workspaces (#62)
- Fixed issues with REST connection (#58)

## [0.3.0] - 2017-11-15

### Added

- Introduced openHAB **Things Explorer** view in the sidebar!
  - Create Items directly from Thing's channels.
  - Quick copy name and Thing UID directly from the sidebar
  - Quick access to the binding documentation
- Insert into Sitemap feature in the openHAB Items view

### Changed

- New configuration parameters:
  - `restCompletions` - toggles completions from REST API
  - `paperPath` - defaults to `paperui`. Change it to `ui` if you're using from before 9th Jan 2017
  - `paperInBrowser` - if set to `true`, will open Paper UI in a browser instead of VSCode window
  - `lspEnabled` - if `true`, will enable communication with openHAB's Language Server. Note that `misc-lsp` add-on needs to be installed.
  - `lspPort` - defaults to `5007`, custom LSP port parameter (#42)
- "Set openHAB host" button on error message (#42)
- **Breaking change**: `openhab.port` parameter is now a number (e.g. `8080` instead of `"8080"`).
Please change it in your settings after upgrade.

### Fixed

- Various Language Server Protocol fixes
- Fixed "switch" icon coloring (#18)

## [0.2.0] - 2017-10-17

### Added

- Language Server Protocol support
- More new snippets

### Changed

- You can now disable REST API connection
- Updated logo icons
- Better error handling
- Paper UI URL is now dynamically detected

### Fixed

- Fixed REST connection with Basic Authentication

## [0.1.0] - 2017-07-07

### Added

- Completely new openHAB Items Explorer view in the sidebar!
  - Preview **all** of your items thanks to the REST API
  - Dynamic rules from the Items Explorer view - including the current state
  - Ability to copy Item's name and state
  - Clicking non-Group item opens it in the Paper UI by default
  - Note: Currently in VS Code stable Items Explorer is permanently visible. VS Code Insiders allows you to hide the tree view thanks to [vscode#29436](https://github.com/Microsoft/vscode/issues/29436)
- Added Items autocompletion (with IntelliSense documentation) (#7)
- Quick search in the Community Forum
- Added icon theme

## [0.0.2] - 2017-06-21

### Added

- Added "openhab.searchCommunity" action allowing to search selected text in the openHAB Community (#13)

### Changed

- openHAB hostname and port are now configurable through user or workspace settings (#14)
- Minor tweaks in the code and documentation (#6 #13)

## [0.0.1] - 2017-06-19

### Added

- Initial release

[0.0.1]: https://github.com/openhab/openhab-vscode/releases/tag/0.0.1
[0.0.2]: https://github.com/openhab/openhab-vscode/compare/0.0.1...0.0.2
[0.1.0]: https://github.com/openhab/openhab-vscode/compare/0.0.2...0.1.0
[0.2.0]: https://github.com/openhab/openhab-vscode/compare/0.1.0...0.2.0
[0.3.0]: https://github.com/openhab/openhab-vscode/compare/0.2.0...0.3.0
[0.3.5]: https://github.com/openhab/openhab-vscode/compare/0.3.0...0.3.5
[0.4.0]: https://github.com/openhab/openhab-vscode/compare/0.3.5...0.4.0
[0.4.1]: https://github.com/openhab/openhab-vscode/compare/0.4.0...0.4.1
[0.5.0]: https://github.com/openhab/openhab-vscode/compare/0.4.1...0.5.0
[0.5.1]: https://github.com/openhab/openhab-vscode/compare/0.5.0...0.5.1
[0.6.0]: https://github.com/openhab/openhab-vscode/compare/0.5.1...0.6.0
[0.7.0]: https://github.com/openhab/openhab-vscode/compare/0.6.0...0.7.0
[0.8.0]: https://github.com/openhab/openhab-vscode/compare/0.7.0...0.8.0
[0.8.0]: https://github.com/openhab/openhab-vscode/compare/0.8.0...0.8.1
[0.8.2]: https://github.com/openhab/openhab-vscode/compare/0.8.1...0.8.2
[1.0.0]: https://github.com/openhab/openhab-vscode/compare/0.8.2...1.0.0
[1.0.1]: https://github.com/s0170071/openhab-vscode/compare/1.0.0...1.0.1
[unreleased]: https://github.com/s0170071/openhab-vscode/compare/1.0.1...HEAD
