'use strict';
import * as vscode from 'vscode';
import * as clipboard from 'clipboardy';
import * as fs from 'fs';
import * as path from 'path';

// get the store file path
function getStoreFile() {
    // get from config 
    var storePath: string = vscode.workspace.getConfiguration().get('store.path');
    if (!storePath) {
        storePath = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
    }
    const storeFilePath = path.join(storePath, '.vscode-store.json');
    if (!fs.existsSync(storeFilePath)) {
        fs.writeFileSync(storeFilePath, '{}');
    };
    return storeFilePath;
}

// read store file
function readStore() {
    return JSON.parse(fs.readFileSync(getStoreFile(), "utf8"));
}

// write data to store file
function writeStore(data) {
    fs.writeFileSync(getStoreFile(), JSON.stringify(data), 'utf8');
}

export const activate = (context: vscode.ExtensionContext) => {

    // Open store file
    const openStore = vscode.commands.registerCommand('store.open', () => {
        const storePath = getStoreFile();
        vscode.workspace.openTextDocument(vscode.Uri.file(storePath))
        .then((doc) => {
            vscode.window.showTextDocument(doc);
        })

    });

    // Create new store
    const newStore = vscode.commands.registerCommand('store.new', () => {
        vscode.window.showInputBox({
            placeHolder: "Enter new key",
            ignoreFocusOut: true,
            prompt: "Enter new key"
        }).then((key) => {
            if (!key) {
                return
            }
            const storeData = readStore();
            // warn the user if the key exists.
            if (new Set(Object.keys(storeData)).has(key.trim())) {
                vscode.window.showWarningMessage('Key already exists.')
                return;
            }
            const editor = vscode.window.activeTextEditor;
            vscode.window.showInputBox({
                ignoreFocusOut: true,
                placeHolder: "Enter value",
                // prefill the selected text
                value: editor ? editor.document.getText(editor.selection) : '',
                prompt: "Enter value"
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

    // Get data from store
    const getStore = vscode.commands.registerCommand('store.get', () => {
        // read the json from disk
        const storeData = readStore();
        vscode.window.showQuickPick(Object.keys(storeData))
            .then(key => {
                if (!key) {
                    return
                }
                const value = storeData[key.trim()];   // get the value
                vscode.window.showInformationMessage(value);
                clipboard.writeSync(value); // Copy the value info to clipboard

            })
    })

    context.subscriptions.push(getStore);

    // Remove data from store
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
