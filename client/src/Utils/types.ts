/**
 * Collection of the currently available configuration parameters
 */
export const OH_CONFIG_PARAMETERS = {
    connection: {
        host: 'connection.host',
        port: 'connection.port',
        authToken: 'connection.authToken',
        basicAuth: {
            username: 'connection.basicAuth.username',
            password: 'connection.basicAuth.password',
        },
    },
    languageserver: {
        remoteEnabled: 'languageserver.remoteEnabled',
        remotePort: 'languageserver.remotePort',
    },
    hover: {
        showItemDefinition: 'hover.showItemDefinition',
        showThingsReferences: 'hover.showThingsReferences',
        showRuleReferences: 'hover.showRuleReferences',
        showSitemapReferences: 'hover.showSitemapReferences',
        showScriptReferences: 'hover.showScriptReferences',
        maxReferencesPerCategory: 'hover.maxReferencesPerCategory',
    },
    itemCasing: 'itemCasing',
    consoleCommand: 'consoleCommand',
    useRestApi: 'useRestApi',
}

/**
 * Collection of deprecated configuration parameters
 */
export const OH_CONFIG_DEPRECATED = {
    host: 'host',
    port: 'port',
    username: 'username',
    password: 'password',
    remoteLspEnabled: 'remoteLspEnabled',
    remoteLspPort: 'remoteLspPort',
    karafCommand: 'karafCommand',
    sitemapPreviewUI: 'sitemapPreviewUI',
}

/**
 * Collection of reusable message strings
 */
export const OH_MESSAGESTRINGS = {
    moreInfo: `More information may be found int the openHAB Extension output!`,
    errors: {
        configValidation: `Error during config validation`,
    },
}

export const OH_GLOBALSTATE_KEYS = {
    extensionVersion: 'openhab_version',
}
