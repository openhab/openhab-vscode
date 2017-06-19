# openHAB VS Code Extension

[openHAB](http://www.openhab.org) is a vendor and techology agnostic open source automation software for your home. This [Visual Studio Code](https://code.visualstudio.com) extension allows you to work with openHAB configuration files (like `*.items`, `*.rules`, `*.sitemap` and `*.script`) thanks to the syntax highlighting, code snippets and integrated search.

The extension is designed with openHAB 2.x in mind - most snippets and design patterns will work in openHAB 2.x

## Features

* Code snippets for openHAB, including [Design Patterns](https://community.openhab.org/tags/designpattern) by Rich Koshak
* Syntax highlighting for the [openHAB DSL](http://docs.openhab.org/configuration/index.html) (rules, items, scripts and sitemaps).
* Integrated quick search of openHAB docs page (`Alt + Shift + O`)
* Integrated Basic UI preview window (`Ctrl + Alt + O` or editor title icon)

![openHAB2 code snippets](images/openhab-demo.gif)

![integrated search engine](images/openhab-demo2.gif)

If you have a sitemap file active in your editor and open Basic UI (`Ctrl + Alt + O` or editor title icon), you'll land directly on the sitemap you're working on.

![Intelligent sitemap preview](images/openhab-sitemap.gif)

## Configuration

You don't need to provide any configuration to this extension. 
It automatically detects the hostname of openHAB. Detection is based on the path of active file.

## Known Issues

None yet. Feel free to [submit an issue](https://github.com/openhab/openhab-vscode/issues) in the repository.

## Release Notes

### 0.0.1

Initial release of VS Code openHAB extension

----

### For More Information

* [openHAB Documentation](http://docs.openhab.org)
* [openHAB Community](https://community.openhab.org)

**Enjoy!**
