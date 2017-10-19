'use strict';
import * as vscode from 'vscode';
import * as clipboard from 'clipboardy';
import * as fs from 'fs';
import * as path from 'path';

function getStoreFile() {
    // TODO: created by admin @ 2017-10-19 11:07:33
    // need to add this to the config
    // get from config 
    var config: string = vscode.workspace.getConfiguration().get('store.rootPath');
    // 
    if (!config) {
        config = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
    }
    const storeFilePath = path.join(config, '.vscode-store.json');
    if (!fs.existsSync(storeFilePath)) {
        fs.writeFileSync(storeFilePath, '{}');
    };
    return storeFilePath;
}

function readStore() {
    return JSON.parse(fs.readFileSync(getStoreFile(), "utf8"));
}

function writeStore(data) {
    fs.writeFileSync(getStoreFile(), JSON.stringify(data), 'utf8');
}


export const activate = (context: vscode.ExtensionContext) => {
    const openStore = vscode.commands.registerCommand('store.open', () => {
        const storePath = getStoreFile();
        vscode.workspace.openTextDocument(vscode.Uri.file(storePath))
        .then((doc) => {
            vscode.window.showTextDocument(doc);
        })

    });

    const newStore = vscode.commands.registerCommand('store.new', () => {
        vscode.window.showInputBox({
            placeHolder: "Enter new key to store",
            ignoreFocusOut: true
        }).then((key) => {
            if (!key) {
                return
            }
            const storeData = readStore();
            // warn the user if the key exists.
            if (new Set(Object.keys(storeData)).has(key.trim())) {
                vscode.window.showWarningMessage('Key already exists. Try removing it and add again.')
                return;
            }
            const editor = vscode.window.activeTextEditor;
            vscode.window.showInputBox({
                ignoreFocusOut: true,
                placeHolder: "Enter value to store",
                // prefill the selected text
                value: editor ? editor.document.getText(editor.selection) : '',
                prompt: "Enter value to store"
            }).then(value => {
                if (!value) {
                    return
                }
                //  Store the data in a json file
                storeData[key.trim()] = value.trim();
                writeStore(storeData);
            })
        });
    });

    context.subscriptions.push(newStore);

    const getStore = vscode.commands.registerCommand('store.get', () => {
        // read the json from disk
        const storeData = readStore();
        vscode.window.showQuickPick(Object.keys(storeData))
            .then(key => {
                if (!key) {
                    return
                }
                const value = storeData[key.trim()];   // get the value
                // IDEA: logged by admin @ 2017-10-16 19:28:53
                // Show the confirmation based on the config
                vscode.window.showInformationMessage(value);
                clipboard.writeSync(value); // Copy the value info to clipboard

            })
    })

    context.subscriptions.push(getStore);

    const removeStore = vscode.commands.registerCommand('store.remove', () => {
        const storeData = readStore();
        vscode.window.showQuickPick(Object.keys(storeData))
            .then(key => {
                if (!key) {
                    return
                }
                delete storeData[key.trim()]   // delete the key value                
                writeStore(storeData);  // write to store
                vscode.window.showInformationMessage(`Removed '${key}' from store`);
            })
    })

    context.subscriptions.push(removeStore);

}
