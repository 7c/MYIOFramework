const { promiseTimeout } = require('mybase')
const { MYIOClient } = require('./MYIOClient.js');
const { MYIOServer } = require('./MYIOServer.js');


function emitSyncTimeout(client, timeoutSeconds, ...args) {
    return promiseTimeout(timeoutSeconds * 1000, new Promise((resolve, reject) => {
        client.emit(...args, (err, ret) => {
            if (err) return reject(err)
            resolve(ret)
        })
    }))
}



function emitSync(client, ...args) {
    return new Promise((resolve, reject) => {
        client.emit(...args, (err, ret) => {
            if (err) return reject(err)
            resolve(ret)
        })
    })
}


module.exports = {
    // Models
    MYIOClient,
    MYIOServer,

    // Utils
    emitSyncTimeout,
    emitSync
}