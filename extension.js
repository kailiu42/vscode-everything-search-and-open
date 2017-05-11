const vscode = require('vscode');
const http = require('http');
const path = require('path');
let config = vscode.workspace.getConfiguration('eso');

function activate(context) {
  let Disposable = vscode.commands.registerCommand('eso.searchEverything', () => {
    everythingSearchAndOpen({ fullpath: true, regex: false });
  });

  let ReDisposable = vscode.commands.registerCommand('eso.searchEverythingRe', () => {
    everythingSearchAndOpen({ fullpath: true, regex: true });
  });

  let FnDisposable = vscode.commands.registerCommand('eso.searchEverythingFn', () => {
    everythingSearchAndOpen({ fullpath: false, regex: false });
  });

  let FnReDisposable = vscode.commands.registerCommand('eso.searchEverythingFnRe', () => {
    everythingSearchAndOpen({ fullpath: false, regex: true });
  });

  context.subscriptions.push(Disposable, ReDisposable, FnDisposable, FnReDisposable);

  context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(() => {
    config = vscode.workspace.getConfiguration('eso');
  }));
}
exports.activate = activate;


function deactivate() {}
exports.deactivate = deactivate;


function everythingSearchAndOpen(option) {
  askForSearchTerm(option)
    .then(
      str => {
        if (str !== undefined) { // User cancelled input
          searchInEverything(option, str)
            .then(
              es_response => {
                selectFile(es_response.results)
                  .then(
                    file => {
                      if (file !== undefined) { // User cancelled list selection
                        openFile(file);
                      }
                    },
                    e => vscode.window.showErrorMessage('Select file failed: ' + e.message));
              },
              e => vscode.window.showErrorMessage('Search in Everything failed: ' + e.message));
        }
      },
      e => vscode.window.showErrorMessage('Input failed: ' + e.message));
}


function askForSearchTerm(option) {
  let input_options = {
    ignoreFocusOut: true,
    placeHolder: 'Type ' + (option.fullpath ? 'full path' : 'file') + ' name to search' + (option.regex ? ', support regular expression' : '')
  };

  return vscode.window.showInputBox(input_options);
}


function searchInEverything(option, str) {
  let http_options = {
    hostname: config.host,
    port: config.port,
    path: encodeURI('/?' + [
      'json=1',
      'path_column=1',
      'sort=' + config.sort,
      'path=' + (option.fullpath ? 1 : 0),
      'regex=' + (option.regex ? 1 : 0),
      's=' + str
    ].join('&'))
  };

  return new Promise((resolve, reject) => {
    const request = http.get(http_options, (response) => {
      response.setEncoding('utf8');

      // Handle Everything response error
      if (response.statusCode < 200 || response.statusCode > 299) {
        reject(new Error(`Abnormal HTTP response from Everything, status code: ${response.statusCode}`));
      }

      let body = '';
      response.on('data', chunk => body += chunk);

      response.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          // Handle Everything response decoding error
          reject(new Error(`Failed to decode Everything response as JSON, body data: ${body}`));
        }
      });
    });

    // Handle request connection errors
    request.on('error', (err) => reject(err));
  });
}


function selectFile(files) {
  files.forEach(f => {
    f.label = f.name;
    f.detail = f.path;
    f.description = f.type;
  });

  let quickpic_options = {
    ignoreFocusOut: true,
    matchOnDescription: true,
    matchOnDetail: true
  };

  return vscode.window.showQuickPick(files, quickpic_options);
}


function openFile(file) {
  const fullname = path.join(file.path, file.name);
  const fileUri = vscode.Uri.file(fullname);
  if (file.type == 'file') {
    vscode.workspace
      .openTextDocument(fileUri)
      .then(doc => vscode.window.showTextDocument(doc));
  } else if (file.type == 'folder') {
    vscode.commands.executeCommand('vscode.openFolder', fileUri);
  }
}
