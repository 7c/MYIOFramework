const { io } = require('socket.io-client')
const chalk = require('chalk')
const { promiseTimeout } = require('mybase')
const debug = require('debug')('MYIOClient')

const isRunningInJest = typeof jest !== 'undefined';

const defaultConfig = {
    port: 7555,
    ip: '127.0.0.1',
    name: 'ioclient',
    namespace: "/",
    scheme: 'http',
    output: false,
    
    onConnect: false,
    onDisconnect: false,
    onError : false
}
const defaultOptions = {
    reconnection: true, // enable reconnection
    // reconnectionAttempts: 3,
    forceNew: true,
    autoConnect: true,
    // ackTimeout: 5000, // 5 seconds
    timeout: 5000, // connection timeout 5 seconds
    reconnectionDelayMax: 5000, // wait 5 seconds before reconnecting
    reconnectionDelay: 2000, // wait 5 seconds between each attempt,
}

// make sure you use socket.io >=4.*
class MYIOClient {
    config = defaultConfig
    socket = false
    isConnected = false

    emitTimeout(timeoutSeconds, ...args) {
        return promiseTimeout(timeoutSeconds * 1000, new Promise((resolve, reject) => {
            this.socket.emit(...args, (err, ret) => {
                if (err) return reject(err)
                resolve(ret)
            })
        }))
    }
    
    emit(...args) {
        return new Promise((resolve, reject) => {
            this.socket.emit(...args, (err, ret) => {
                if (err) return reject(err)
                resolve(ret)
            })
        })
    }

    async whoami(timeoutSeconds = 5) {
        return this.emitTimeout(timeoutSeconds, 'whoami')
    }

    constructor(configuration, opts) {
        this.config = Object.assign(defaultConfig, configuration)
        // connect does not really connect unless you initiate a call
        let connectionString = `${this.config.scheme}://${this.config.ip}:${this.config.port}${this.config.namespace}` 
        this.socket = io(connectionString, Object.assign(defaultOptions, opts))

        this.socket.on('connect', () => {
            if (this.config.onConnect && typeof this.config.onConnect === 'function')
                this.config.onConnect(this)

            this.#log('connected')
            this.isConnected = true
        })
        this.socket.on('disconnect', () => {
            if (this.config.onDisconnect && typeof this.config.onDisconnect === 'function')
                this.config.onDisconnect(this)

            this.#log('disconnected')
            this.isConnected = false

        })
        this.socket.on('reconnect', () => {
            this.#log('reconnected')
            this.isConnected = true
        })
        
        this.socket.on('error', (err) => {
            if (this.config.onError && typeof this.config.onError === 'function')
                this.config.onError(err)
            this.#log('error', err)
        })
        this.socket.on('reconnect_failed', () => {
            this.#log('reconnect_failed')
        })

        this.socket.on('reconnect_attempt', () => {
            this.#log('reconnect_attempt')
        })

        this.#log(`constructor passed ${connectionString}`)
    }

    // launch() {
    //     this.socket.emit('__connect',1) // this will initiate the connection
    // }

    #log(scope, ...str) {
        if (this.config.output)
            console.log(chalk.bgBlueBright(this.config.name), chalk.bgYellow(`socketio-client:${scope}`), ...str)
    }

    async connect(timeoutSeconds = 5) {
        let started = Date.now()
        while(true) {
            // console.log(`>> ${timeoutSeconds}`,this.isConnected?'connected':'not connected')
            if (this.isConnected)
                return true
            if (Date.now()-started > timeoutSeconds*1000) return false
            await new Promise((resolve) => setTimeout(resolve, 100))
        }
    }

    disconnect() {
        this.socket.disconnect()
    }


}

module.exports = { MYIOClient }

