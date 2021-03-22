import axios, { AxiosRequestConfig } from 'axios'
import * as vscode from 'vscode'
import { OH_CONFIG_PARAMETERS, OH_MESSAGESTRINGS } from './types'
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
     * Initialize the ConfigManager
     */
    private constructor() {
        this.deprecationWarningShown = false
        this.updateConfig()
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
     * Fetch and store the latest WorkspaceConfiguration
     */
    private updateConfig() {
        this.currentConfig = vscode.workspace.getConfiguration('openhab')
        console.log("Update Config Manager")
    }

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
        if(returnValue !== null){
            utils.appendToOutput(`Usage of deprecated config ${parameter} detected.`)
            this.showDeprecationWarning();
        }

        return returnValue
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
     * Checks if a parameter is available in the given config and if it has a value and returns it.
     * Also encodes needed parameters directly
     * @param config The workspace configuration to search in
     * @param parameter The parameter to search for
     * @returns The configuration value, the encoded configuration value when needed or null
     */
    private static checkAndGet(config: vscode.WorkspaceConfiguration, parameter: string): string|number|boolean|null {
        if(config.has(parameter) && config.get(parameter) !== null){
            // Encode basic auth credentials
            if(parameter.match(ConfigManager.ENCODING_MATCH))
                return encodeURIComponent(config.get(parameter))

            return config.get(parameter)
        }

        return null
    }

    /**
     * Updates an openHAB specific config parameter.
     */
    public static update(configParameter: string, value: any, target?: vscode.ConfigurationTarget) {
        let config = vscode.workspace.getConfiguration('openhab')

        if(config.has(configParameter)) {
            if(target == undefined) {
                config.update(configParameter, value)
            }
            else {
                config.update(configParameter, value, target)
            }

            ConfigManager.getInstance().updateConfig()
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
     * Generate an error message and provide some options for solving the error
     *
     * @param err The current error
     * @param message The specific error message
     * @param baseMessage The base message available for overwriting the title
     */
    private async handleConfigError(err, message: string = OH_MESSAGESTRINGS.moreInfo, baseMessage: string = OH_MESSAGESTRINGS.errors.configValidation) {
        // Show error message with action buttons
        const showOutput = 'Show Output'
        const result = await vscode.window.showErrorMessage(`${baseMessage}\n\n${message}`, showOutput)

        // Action based on user input
        if(result == showOutput)
            utils.getOutputChannel().show()
    }

    /**
     * Show a warning message, when deprecated config values are used
     */
    private static async showDeprecationWarning() {
        if(!ConfigManager.getInstance().deprecationWarningShown){
            ConfigManager.getInstance().deprecationWarningShown = true
            const migrateStandardValues = 'Migrate minimal config directly!'

            let result = await vscode.window.showWarningMessage(ConfigManager.DEPRECATION_WARNING_MESSAGE, { modal: true }, migrateStandardValues)

            // Action based on user input
            if(result == migrateStandardValues)
                ConfigManager.migrateDeprecatedParameters()
        }
    }

    /**
     * Migrate deprecated settings to their new parameters
     */
    private static migrateDeprecatedParameters() {
        const logPrefix = `openHAB Extension: `
        let currentConfig = ConfigManager.getInstance().currentConfig
        let currentParameter = OH_CONFIG_PARAMETERS.connection.host

        const updatedMessage = `Updated openhab.${currentParameter}.`
        const checkParamMessage = `Check if openhab.${currentParameter} can be migrated`
        const migrationPossibleMessage = `openhab.${currentParameter} can be migrated safely.`
        const alreadySetMessage = `openhab.${currentParameter} is already set, equals the old config or can't be migrated.`
        const migrationStartMessage = `Starting config migration now.`
        const migrationFinishedMessage = `Starting config migration now.`

        console.info(logPrefix + migrationStartMessage)
        utils.appendToOutput(migrationStartMessage)

        let hostConfig = currentConfig.get(currentParameter)
        let hostConfigDeprecated = currentConfig.get('host')

        console.info(logPrefix + checkParamMessage)
        if(!hostConfig && hostConfigDeprecated != null) {
            console.info(logPrefix + migrationPossibleMessage)
            let depConfigInspectResult = currentConfig.inspect('host')

            ConfigManager.update(
                currentParameter,
                hostConfigDeprecated,
                (depConfigInspectResult.globalValue == hostConfigDeprecated) ?
                    vscode.ConfigurationTarget.Global :
                    vscode.ConfigurationTarget.Workspace
            )
            utils.appendToOutput(updatedMessage)
        }
        else {
            console.info(logPrefix + alreadySetMessage)
            utils.appendToOutput(alreadySetMessage)
        }

        currentParameter = OH_CONFIG_PARAMETERS.connection.port
        let portConfig = currentConfig.get(currentParameter)
        let portConfigDeprecated = currentConfig.get('port')

        console.info(logPrefix + checkParamMessage)
        if(!portConfig && portConfigDeprecated != null){
            console.info(logPrefix + migrationPossibleMessage)
            let depConfigInspectResult = currentConfig.inspect('port')

            ConfigManager.update(
                currentParameter,
                portConfigDeprecated,
                (depConfigInspectResult.globalValue == portConfigDeprecated) ?
                    vscode.ConfigurationTarget.Global :
                    vscode.ConfigurationTarget.Workspace
            )
            utils.appendToOutput(updatedMessage)
        }
        else{
            console.info(logPrefix + alreadySetMessage)
            utils.appendToOutput(alreadySetMessage)
        }

        currentParameter = OH_CONFIG_PARAMETERS.connection.authToken
        let authTokenConfig = currentConfig.get(currentParameter)
        let usernameConfigDeprecated = currentConfig.get('username') as string

        console.info(logPrefix + checkParamMessage)
        if(!authTokenConfig && usernameConfigDeprecated != null){
            console.info(logPrefix + `Checking if username setting exists and has been used as auth token`)

            // Check if given username is a openHAB 3 token
            let usernameSegments = usernameConfigDeprecated.split('.')
            if(usernameSegments.length === 3 && usernameSegments[0] === 'oh'){
                console.info(logPrefix + `Detected auth token in username setting. Using it for openhab.${currentParameter} now`)
                let depConfigInspectResult = currentConfig.inspect('username')

                ConfigManager.update(
                    OH_CONFIG_PARAMETERS.connection.authToken,
                    usernameConfigDeprecated,
                    (depConfigInspectResult.globalValue == usernameConfigDeprecated) ?
                        vscode.ConfigurationTarget.Global :
                        vscode.ConfigurationTarget.Workspace
                )
                utils.appendToOutput(updatedMessage)
            }
        }
        else{
            console.info(logPrefix + alreadySetMessage)
            utils.appendToOutput(alreadySetMessage)
        }

        console.info(logPrefix + migrationFinishedMessage)
        utils.appendToOutput(migrationFinishedMessage)
    }
}