'use strict';
import * as vscode from 'vscode';
import * as clipboard from 'clipboardy';
import * as fs from 'fs';
import * as path from 'path';

function getStoreFile() {
    var config: string = vscode.workspace.getConfiguration().get('rootPath');
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

        vscode.window.showInputBox({
            placeHolder: "Enter new key to store",
            ignoreFocusOut: true
        }).then((key) => {
            if (!key) {
                return
            }
            // TODO: created by admin @ 2017-10-16 19:08:57
            // if the key already exists user has to be warned. 
            vscode.window.showInputBox({
                ignoreFocusOut: true,
                placeHolder: "Enter value to store"
            }).then(value => {
                if (!value) {
                    return
                }
                console.log(key, value)
                //  Store the data in a json file
                const storeFilePath = getStoreFile()
                const storeData = JSON.parse(fs.readFileSync(storeFilePath, 'utf8'));
                storeData[key] = value;
                console.log('storeData', storeData)
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
                vscode.window.showInformationMessage(`Removed ${key} from store`);
            })
    })

    context.subscriptions.push(removeStore);

}
