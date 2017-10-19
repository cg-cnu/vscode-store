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
    const storeFilePath = path.join(config, '.vscode-store');
    if (!fs.existsSync(storeFilePath)) {
        fs.writeFileSync(storeFilePath, '{}');
    };
    return storeFilePath;
}

export const activate = (context: vscode.ExtensionContext) => {

    const newStore = vscode.commands.registerCommand('store.new', () => {
        const editor = vscode.window.activeTextEditor;
        vscode.window.showInputBox({
            placeHolder: "Enter new key to store",
            ignoreFocusOut: true
        }).then((key) => {
            if (!key) {
                return
            }
            const storeFilePath = getStoreFile()
            const storeData = JSON.parse(fs.readFileSync(storeFilePath, 'utf8'));

            // if the key already exists user has to be warned.
            if( new Set(Object.keys(storeData) ).has(key) ){
                vscode.window.showWarningMessage('Key already exists. Try removing it and add again.')
                return;
            }
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
                storeData[key] = value;
                fs.writeFileSync(storeFilePath, JSON.stringify(storeData), 'utf8');
            })
        });
    });

    context.subscriptions.push(newStore);

    const getStore = vscode.commands.registerCommand('store.get', () => {
        // read the json from disk
        const storeData = JSON.parse(fs.readFileSync(getStoreFile(), "utf8"));
        vscode.window.showQuickPick(Object.keys(storeData))
            .then(key => {
                if (!key) {
                    return
                }
                // get the value 
                const value = storeData[key];
                // IDEA: logged by admin @ 2017-10-16 19:28:53
                // Show the confirmation based on the config
                vscode.window.showInformationMessage(value);
                // Copy the value info to clipboard
                clipboard.writeSync(value);
            })
    })

    context.subscriptions.push(getStore);

    const removeStore = vscode.commands.registerCommand('store.remove', () => {
        // read the json from disk
        const storeFilePath = getStoreFile()
        const storeData = JSON.parse(fs.readFileSync(storeFilePath, "utf8"));
        vscode.window.showQuickPick(Object.keys(storeData))
            .then(key => {
                if (!key) {
                    return
                }
                // delete the key value
                delete storeData[key]
                // Write the file to disk
                fs.writeFileSync( storeFilePath, JSON.stringify(storeData), 'utf8');
                vscode.window.showInformationMessage(`Removed '${key}' from store`);
            })
    })

    context.subscriptions.push(removeStore);

}
