// /**
//      * Migrate deprecated settings to their new parameters
//      */
//  private static migrateDeprecatedParameters() {
//     const logPrefix = `openHAB Extension: `
//     let currentConfig = ConfigManager.getInstance().currentConfig
//     let currentParameter = OH_CONFIG_PARAMETERS.connection.host

//     const updatedMessage = `Updated openhab.${currentParameter}.`
//     const checkParamMessage = `Check if openhab.${currentParameter} can be migrated`
//     const migrationPossibleMessage = `openhab.${currentParameter} can be migrated safely.`
//     const alreadySetMessage = `openhab.${currentParameter} is already set, equals the old config or can't be migrated.`
//     const migrationStartMessage = `Starting config migration now.`
//     const migrationFinishedMessage = `Starting config migration now.`

//     console.info(logPrefix + migrationStartMessage)
//     utils.appendToOutput(migrationStartMessage)

//     let hostConfig = currentConfig.get(currentParameter)
//     let hostConfigDeprecated = currentConfig.get('host')

//     console.info(logPrefix + checkParamMessage)
//     if(!hostConfig && hostConfigDeprecated != null) {
//         console.info(logPrefix + migrationPossibleMessage)
//         let depConfigInspectResult = currentConfig.inspect('host')

//         ConfigManager.update(
//             currentParameter,
//             hostConfigDeprecated,
//             (depConfigInspectResult.globalValue == hostConfigDeprecated) ?
//                 vscode.ConfigurationTarget.Global :
//                 vscode.ConfigurationTarget.Workspace
//         )
//         utils.appendToOutput(updatedMessage)
//     }
//     else {
//         console.info(logPrefix + alreadySetMessage)
//         utils.appendToOutput(alreadySetMessage)
//     }

//     currentParameter = OH_CONFIG_PARAMETERS.connection.port
//     let portConfig = currentConfig.get(currentParameter)
//     let portConfigDeprecated = currentConfig.get('port')

//     console.info(logPrefix + checkParamMessage)
//     if(!portConfig && portConfigDeprecated != null){
//         console.info(logPrefix + migrationPossibleMessage)
//         let depConfigInspectResult = currentConfig.inspect('port')

//         ConfigManager.update(
//             currentParameter,
//             portConfigDeprecated,
//             (depConfigInspectResult.globalValue == portConfigDeprecated) ?
//                 vscode.ConfigurationTarget.Global :
//                 vscode.ConfigurationTarget.Workspace
//         )
//         utils.appendToOutput(updatedMessage)
//     }
//     else{
//         console.info(logPrefix + alreadySetMessage)
//         utils.appendToOutput(alreadySetMessage)
//     }

//     currentParameter = OH_CONFIG_PARAMETERS.connection.authToken
//     let authTokenConfig = currentConfig.get(currentParameter)
//     let usernameConfigDeprecated = currentConfig.get('username') as string

//     console.info(logPrefix + checkParamMessage)
//     if(!authTokenConfig && usernameConfigDeprecated != null){
//         console.info(logPrefix + `Checking if username setting exists and has been used as auth token`)

//         // Check if given username is a openHAB 3 token
//         let usernameSegments = usernameConfigDeprecated.split('.')
//         if(usernameSegments.length === 3 && usernameSegments[0] === 'oh'){
//             console.info(logPrefix + `Detected auth token in username setting. Using it for openhab.${currentParameter} now`)
//             let depConfigInspectResult = currentConfig.inspect('username')

//             ConfigManager.update(
//                 OH_CONFIG_PARAMETERS.connection.authToken,
//                 usernameConfigDeprecated,
//                 (depConfigInspectResult.globalValue == usernameConfigDeprecated) ?
//                     vscode.ConfigurationTarget.Global :
//                     vscode.ConfigurationTarget.Workspace
//             )
//             utils.appendToOutput(updatedMessage)
//         }
//     }
//     else{
//         console.info(logPrefix + alreadySetMessage)
//         utils.appendToOutput(alreadySetMessage)
//     }

//     console.info(logPrefix + migrationFinishedMessage)
//     utils.appendToOutput(migrationFinishedMessage)
// }