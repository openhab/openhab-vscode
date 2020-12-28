# openHAB VS Code Extension

[![Azure DevOps builds (branch)][ADOBuildBadgeImage]][ADOBuildBadgeImageLink]
[![Azure DevOps tests (branch)][ADOTestImage]][ADOTestImageLink]
[![EPL-2.0][LicenseBadgeImage]][LicenseBadgeImageLink]
[![Visual Studio Marketplace Rating][MarketplaceRatingBadgeImage]][MarketplaceRatingBadgeImageLink]
[![Visual Studio Marketplace Downloads)][MarketplaceDownloadBadgeImage]][MarketplaceDownloadBadgeImageLink]
[![GitHub release][GitHubReleaseBadge]][GitHubReleaseBadgeLink]

[openHAB](http://www.openhab.org) is a vendor and techology agnostic open source automation software for your home. This [Visual Studio Code](https://code.visualstudio.com) extension allows you to work with openHAB configuration files (like `*.items`, `*.rules`, `*.sitemap` and `*.script`) thanks to the syntax highlighting, code snippets and integrated search.

The extension is designed with openHAB 2.x in mind - most snippets and design patterns will work in openHAB 2.x

## Features

- Syntax highlighting for the [openHAB DSL](https://www.openhab.org/docs/configuration/) (rules, items, scripts and sitemaps).
- Code snippets for openHAB, including [Design Patterns](https://community.openhab.org/tags/designpattern) by Rich Koshak
- Integrated quick search of [openHAB Community](https://community.openhab.org)
- Integrated Basic UI browser window (`Ctrl + Alt + O` or editor title icon)
- Integrated Paper UI preview for the Items and Things
- Integration with openHAB REST API
- List of all Items accessible from the tree view
- Code completions
- Language Server Protocol support - syntax validation
- Dynamic Items creation from Thing's channels
- Quick openHAB console access
- Add Items to Sitemap with one click
- Get live Item states while hovering over item names in the Editor

![openHAB2 code snippets](docs/images/openhab-demo.gif)

## Configuration

Learn more about the configuration options in our [documentation](https://github.com/openhab/openhab-vscode/blob/master/docs/USAGE.md) on github.

## Things Explorer demo

![Things Explorer](docs/images/openhab-things.gif)

## Sitemap Insert demo

![Quick insert Items into Sitemap](docs/images/openhab-sitemap-insert.gif)

## Known Issues

Check out [existing issues](https://github.com/openhab/openhab-vscode/issues) in the repository.

## Release Notes

See [CHANGELOG.md](https://github.com/openhab/openhab-vscode/blob/master/CHANGELOG.md) file for the details.

----

## Contributing

Everyone is invited to improve this extension.

Check out the extension code in our [GitHub repository](https://github.com/openhab/openhab-vscode/).
See [Contributing.md](https://github.com/openhab/openhab-vscode/blob/master/CONTRIBUTING.md) file for further technical and formal details for contributing something to the openHAB project.

### For More Information

- [openHAB Documentation](https://www.openhab.org/docs/)
- [openHAB Community](https://community.openhab.org)

**Enjoy!**

[ADOBuildBadgeImage]: https://img.shields.io/azure-devops/build/openhab/82e39b03-2e63-4a34-84ca-3cb57be32202/2/master?logo=azure-pipelines&logoColor=blue
[ADOBuildBadgeImageLink]: https://dev.azure.com/openhab/vscode-openhab/_build?definitionId=2

[ADOTestImage]: https://img.shields.io/azure-devops/tests/openhab/82e39b03-2e63-4a34-84ca-3cb57be32202/2/master?logo=azure-devops&logoColor=blue
[ADOTestImageLink]: https://dev.azure.com/openhab/vscode-openhab/_build?definitionId=2

[LicenseBadgeImage]: https://img.shields.io/badge/license-EPL%202-green.svg (License Information)
[LicenseBadgeImageLink]: https://opensource.org/licenses/EPL-2.0

[MarketplaceRatingBadgeImage]: https://img.shields.io/visual-studio-marketplace/stars/openhab.openhab?color=orange&label=marketplace&logo=visual-studio-code&logoColor=blue (Star rating)
[MarketplaceRatingBadgeImageLink]: https://marketplace.visualstudio.com/items?itemName=openhab.openhab&ssr=false#review-details

[MarketplaceDownloadBadgeImage]: https://img.shields.io/visual-studio-marketplace/d/openhab.openhab?logo=visual-studio-code&logoColor=blue
[MarketplaceDownloadBadgeImageLink]: https://marketplace.visualstudio.com/items?itemName=openhab.openhab

[GitHubReleaseBadge]: https://img.shields.io/github/v/release/openhab/openhab-vscode?include_prereleases (latest by date including pre-releases)
[GitHubReleaseBadgeLink]: https://github.com/openhab/openhab-vscode/releases
