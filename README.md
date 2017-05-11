# Everything Search and Open for Visual Studio Code

This is an extension for Microsoft Visual Studio Code. It allows searching file name in Everthing and select a file to open in the result list.

[Everything](https://www.voidtools.com/) is an terrific file searching tool for Windows platform. It is super fast, small and free to use.

As Evertying is only available on Windows, this extension supports Windows only.

## How to Use
-------------

### Quick start

* Install and configure Everthing first, see below.
* Press Ctrl+K, Ctrl+E to activate the file name input box.
* Type in the file name you would like to search. Any part of the full path can be used to search. Regular expression is turned off by default.
* Press Enter after input the file name, a list of files with their path information will be shown.
* Select the one you are looking for from the list and it will be opened in VS Code.

### Use Command Palette

This extension registers four commands.

#### eso.searchEverything

Search full path name in Everything, without regular expression support.

This one is bind to keyboard shortcut Ctrl+K, Ctrl+E by default.

#### eso.searchEverythingRe

Search full path name in Everything, supports regular expression.

#### eso.searchEverythingFn

Search only file name in Everything, without regular expression support.

#### eso.searchEverythingFnRe

Search only file name in Everything, supports regular expression.

## Requirements
---------------

Everthing tool must be installed and HTTP support turned on.

Please consult everthing [website](https://www.voidtools.com/) for download and installation instructions.

HTTP support can be enabled in Options -> HTTP Server -> Enable HTTP Server.

Bind to Interface option should be set to 127.0.0.1 for security reason.

Listen to Port should be set to a spare port number on your computer. This extension by default use port 4321 to conenct to Everthing HTTP server. You can change that in VS Code settings. Make sure the port number in VS Code and Everything option are the same.

Other Everthing HTTP Server options could be left empty.

## Extension Settings
---------------------

This extension contributes the following settings:

* `eso.host`: IP address where Everthing listens on, defaults to 127.0.0.1
* `eso.port`: Port number where Everthing listens on, defaults to 4321
* `eso.sort`: How search results from Everything are sorted, can be one of 'name', 'path', 'date_modified', 'size'

## Release Notes
----------------

### 0.1.0

Initial release.
