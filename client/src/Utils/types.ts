export const OH_CONFIG_PARAMETERS = {
    connection : {
        host : 'connection.host',
        port : 'connection.port',
        authToken : 'connection.authToken',
        basicAuth : {
            username : 'connection.basicAuth.username',
            password : 'connection.basicAuth.password',
        }
    },
    languageserver : {
        remoteEnabled : 'languageserver.remoteEnabled',
        remotePort : 'languageserver.remotePort',
    },
    itemCasing : 'itemCasing',
    consoleCommand : 'consoleCommand',
    useRestApi : 'useRestApi',
}

export const OH_MESSAGESTRINGS = {
    moreInfo : `More information may be found int the openHAB Extension output!`,
    errors : {
        configValidation : `Error during config validation`,
    },
}
