import axios, { AxiosRequestConfig } from 'axios'
import * as vscode from 'vscode'
import { window } from 'vscode'
import { OH_CONFIG_PARAMETERS } from './types'
import * as utils from './Utils'

/**
 * Handles the extension configuration.
 * Provides additional logic for config changes and deprecated parameters.
 *
 * @author Jerome Luckenbach - Initial contribution
 *
 */
export class ConfigManager {

    private static instance: ConfigManager|undefined

    private currentConfig: vscode.WorkspaceConfiguration

    private static ENCODING_MATCH: RegExp = /^(username|password)$/

    private deprecationWarningShown: boolean
    private static DEPRECATION_WARNING_MESSAGE = `You are using deprecated config values for the openHAB Extension!\n
Those values are still used for the moment, but will be removed in newer extension versions.\n
Please take a look at the current extension settings\nand update to the new config parameters and also remove the deprecated ones.`

    /**
     * Searches and returns a config value or null
     *
     * @param configParameter The parameter to search for. Can be used with OH_CONFIG_PARAMETERS constant.
     * @returns The config value or null
     */
    public static get(configParameter: string): string|number|boolean|null {
        let config = ConfigManager.getInstance().currentConfig;

        // Check if current parameter is available
        if(config.has(configParameter) && config.get(configParameter) !== null){

            // Double check if auth token is available and valid
            if (configParameter == OH_CONFIG_PARAMETERS.connection.authToken && !ConfigManager.tokenAuthAvailable())
                return null

            return config.get(configParameter)
        }

        // If no current Parameter is available, check if a deprecated parameter is available
        let parameterObject = configParameter.split('.')
        let parameter = parameterObject[parameterObject.length - 1]
        let returnValue = null // Return null if nothing is found at all

        // Use deprecated version as return value
        switch (parameterObject[0]) {
            case 'connection':
                returnValue = this.checkAndGet(config, parameter)
                break
            case 'languageserver':
                switch (parameter) {
                    case 'remoteEnabled':
                        returnValue = this.checkAndGet(config, 'remoteLspEnabled')
                        break
                    case 'remotePort':
                        returnValue = this.checkAndGet(config, 'remoteLspPort')
                        break
                }
                break
        }

        // Output a warning with a "Dismiss" button to prevent warning from showing too often
        if(returnValue !== null)
            this.showDeprecationWarning();


        return returnValue
    }

    /**
     * Show a warning message, when deprecated config values are used
     */
    private static async showDeprecationWarning() {
        const openConfig = 'Open config dialog'
        const openConfigJSON = 'Open config File (JSON)'
        const dismissButton = 'Dismiss Warning for this session'

        utils.appendToOutput(ConfigManager.DEPRECATION_WARNING_MESSAGE)
        if(!ConfigManager.getInstance().deprecationWarningShown){
            ConfigManager.getInstance().deprecationWarningShown = true
            let result = await window.showWarningMessage(ConfigManager.DEPRECATION_WARNING_MESSAGE, { modal: true }, openConfig, openConfigJSON)

            // Action based on user input
            switch (result) {
                case openConfig:
                    vscode.commands.executeCommand('workbench.action.openWorkspaceSettings')
                    break
                case openConfigJSON:
                    vscode.commands.executeCommand('workbench.action.openWorkspaceSettingsFile')
                    break
            }
        }
    }

    /**
     * Checks if a parameter is available in the given config and if it has a value and returns it.
     * Also encodes needed parameters directly
     * @param config The workspace configuration to search in
     * @param parameter The parameter to search for
     * @returns The configuration value, the encoded configuration value when needed or null
     */
    private static checkAndGet(config: vscode.WorkspaceConfiguration, parameter: string): string|number|boolean|null{

        if(config.has(parameter) && config.get(parameter) !== null){

            // Encode basic auth credentials
            if(parameter.match(ConfigManager.ENCODING_MATCH)){
                return encodeURIComponent(config.get(parameter))
            }

            return config.get(parameter)
        }

        return null
    }

    /**
     * Updates an openHAB specific config parameter.
     */
    public static update(configParameter: string, value: any){
        let config = ConfigManager.getInstance().currentConfig;

        if(config.has(configParameter)){
            config.update(configParameter, value)
        }
    }

    /**
     * Watches for configuration changes and updates or reacts to openHAB config related changes.
     *
     * @param context The extension context
     */
    public static attachConfigChangeWatcher(context){
        let instance = ConfigManager.getInstance()

        // Subscribe to all configuration changed events
        context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {

            if(e.affectsConfiguration('openhab')){
                instance.updateConfig()
            }

            // Check for api token changes and check if a valid apitoken has been set.
            // Output an error ortherwise
            if(e.affectsConfiguration('openhab.connection.authToken') ){
                console.debug(`Auth token config has been changed. Validating token now.`)

                const token = instance.currentConfig.get(OH_CONFIG_PARAMETERS.connection.authToken, null)

                let config: AxiosRequestConfig = {
                    url: utils.getHost() + '/rest/auth/apitokens',
                    headers: {
                        'X-OPENHAB-TOKEN': `${token}`
                    }
                }

                axios(config)
                    .then((_response) => {
                        utils.appendToOutput(`Newly configured auth token validated successfully!`)
                    })
                    .catch((error) => {
                        if(error.response.status === 401){
                            console.error(`Could not validate configured auth token.`, error)
                            utils.appendToOutput(`Could not validate configured auth token.`)
                            ConfigManager.getInstance().handleConfigError(error, `Could not validate configured auth token.`)
                        }
                        else {
                            utils.handleRequestError(error)
                        }
                    })
            }

            // Refresh treeviews when a openHAB connection related setting has changed
            if(e.affectsConfiguration('openhab.connection') ){
                console.debug("openHAB Extension configuration has changed.")
                vscode.commands.executeCommand('openhab.command.refreshEntry');
            }
        }))

    }

    /**
     * Checks if ther is an authToken property available and valid
     * @returns {boolean} true when tokenAuth is available and useable, false otherwise
     */
    public static tokenAuthAvailable(): boolean {
        let tokenResult = ConfigManager.getInstance().currentConfig.get(OH_CONFIG_PARAMETERS.connection.authToken, null)
        return (!tokenResult || tokenResult === '') ? false : true
    }

    /**
     * Returns the ConfigManager instance and instanciates it before if not yet available
     * @returns {ConfigManager} The ConfigManager instance
     */
    private static getInstance(): ConfigManager {

        // Create a new instance if there is none available yet
        if(!ConfigManager.instance){
            ConfigManager.instance = new ConfigManager()
        }

        return ConfigManager.instance
    }

    /**
     * Initialize the ConfigManager
     */
    private constructor() {
        this.deprecationWarningShown = false

        // Get current config
        this.updateConfig()
    }

    /**
     * Fetch and store the latest WorkspaceConfiguration
     */
    private updateConfig() {
        this.currentConfig = vscode.workspace.getConfiguration('openhab')
        console.log("Update Config Manager")
    }

    /**
     * Generate an error message and provide some options for solving the error
     *
     * @param err The current error
     * @param message The specific error message
     * @param baseMessage The base message available for overwriting the title
     */
    private async handleConfigError(err, message: string|null = null, baseMessage: string = `Error during config validation`) {
        const openConfig = 'Open config dialog'
        const openConfigJSON = 'Open config File (JSON)'
        const showOutput = 'Show Output'

        // Show error message with action buttons
        const detailMessage = message ? message : 'More information may be found int the openHAB Extension output!'
        const result = await vscode.window.showErrorMessage(`${baseMessage}\n\n${detailMessage}`, openConfig, openConfigJSON, showOutput)

        // Action based on user input
        switch (result) {
            case openConfig:
                vscode.commands.executeCommand('workbench.action.openWorkspaceSettings')
                break
            case openConfigJSON:
                vscode.commands.executeCommand('workbench.action.openWorkspaceSettingsFile')
                break
            case showOutput:
                utils.getOutputChannel().show()
                break
            default:
                break
        }
    }
}