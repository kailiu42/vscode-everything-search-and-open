const vscode = require('vscode');
const http = require('http');
const path = require('path');
let config = vscode.workspace.getConfiguration('eso');

function activate(context) {
  let Disposable = vscode.commands.registerCommand('eso.search', () => {
    everythingSearchAndOpen({ fullpath: true, regex: false, inWorkspace: false });
  });

  let ReDisposable = vscode.commands.registerCommand('eso.searchRe', () => {
    everythingSearchAndOpen({ fullpath: true, regex: true, inWorkspace: false });
  });

  let FnDisposable = vscode.commands.registerCommand('eso.searchFn', () => {
    everythingSearchAndOpen({ fullpath: false, regex: false, inWorkspace: false });
  });

  let FnReDisposable = vscode.commands.registerCommand('eso.searchFnRe', () => {
    everythingSearchAndOpen({ fullpath: false, regex: true, inWorkspace: false });
  });

  // Everthing does not accept a parameter of "search root", the "search
  // workspace files only" feature actually prepends workspace root folder
  // names to the user search pattern before passing it to Everything.
  // Due to this the multi-root workspace feature conflicts with regex search
  // as there is no way to construct a (regex) query string which includes all the
  // workspace roots and user search patterns. Thus only non-regex search for
  // workspace files is supported, as non-regex search support the OR(|) operator.
  let WSDisposable = vscode.commands.registerCommand('eso.searchWS', () => {
    everythingSearchAndOpen({ fullpath: true, regex: false, inWorkspace: true });
  });

  context.subscriptions.push(Disposable, ReDisposable, FnDisposable, FnReDisposable, WSDisposable);

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
    placeHolder: 'Type ' +
      (option.fullpath ? 'full path' : 'file') + ' name to search' +
      (option.regex ? ', support regular expression' : '') +
      (option.inWorkspace ? ', workspace files only' : '')
  };

  return vscode.window.showInputBox(input_options);
}


function buildSearchStr(option, str) {
  if (!option.inWorkspace) { // Not searching workspace files only
    return str;
  } else {
    let wsf = vscode.workspace.workspaceFolders;

    if (wsf === undefined) { // No folder opened in workspace, fall back to full filesystem search
      return str;
    } else {
      let patterns = [];
      let userPattern = '\\*' + str + '*';

      wsf.forEach((element) => {
        patterns.push(element.uri.fsPath + userPattern);
      });

      return patterns.join(' | ');
    }
  }
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
      's=' + buildSearchStr(option, str)
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
