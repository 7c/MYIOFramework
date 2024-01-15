const { io } = require('socket.io-client')
const { promiseTimeout } = require('./shared')

const defaultConfig = {
    name: 'ioclient',

    // target
    scheme: 'http',
    hostname: '127.0.0.1',
    port: 7555,
    namespace: "/",
    // target
    // url: 'http://127.0.0.1:7555/',
    
    
    output: false,

    onConnect: false,
    onDisconnect: false,
    onError : false
}
const defaultOptions = {
    reconnection: true, // enable reconnection
    path: '/socket.io',
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

    constructor(configuration={}, opts={}) {
        this.config = Object.assign({},defaultConfig, configuration)
        this.opts = Object.assign({},defaultOptions, opts)
        
        // connect does not really connect unless you initiate a call
        let connectionString = `${this.config.scheme}://${this.config.hostname}:${this.config.port}${this.config.namespace}` 
        if (this.config.url) connectionString = this.config.url
        this.socket = io(connectionString, this.opts)

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

        this.#log(`constructor passed ${connectionString}`, this.opts)
    }

    #log(scope, ...str) {
        if (this.config.output)
            console.log(`socketio-client:${scope}`,`/${this.config.name}${this.opts.path}`, ...str)
    }

    async connect(timeoutSeconds = 5) {
        let started = Date.now()
        while(true) {
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

