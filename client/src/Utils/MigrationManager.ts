import * as vscode from 'vscode'
import { UpdateNoticePanel } from '../WebViews/UpdateNoticePanel'
import { OH_GLOBALSTATE_KEYS } from './types'

/**
 * Provides helper methods and checks for a comfortable and guied migration on updates
 *
 * @author Jerome Luckenbach - Initial contribution
 */
export class MigrationManager {

    static updateCheck(context: vscode.ExtensionContext) {
        let currentVersion = context.globalState.get(OH_GLOBALSTATE_KEYS.extensionVersion)
        let packageJSON = vscode.extensions.getExtension('openhab.openhab').packageJSON

        if(packageJSON.version != currentVersion){
            UpdateNoticePanel.createOrShow(context.extensionUri)
            context.globalState.update(OH_GLOBALSTATE_KEYS.extensionVersion, packageJSON.version)
        }

    }

}
