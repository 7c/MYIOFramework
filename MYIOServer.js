const app = require('express')()
const { validIp } = require('mybase')
const chalk = require('chalk')
const socketio = require('socket.io')

const isRunningInJest = typeof jest !== 'undefined';

const defaultConfig = {
    port: 7555,
    ip: '127.0.0.1',
    name: 'ioserver',
    output: false,
    onClientDisconnect: false,
    onClientConnect: false,
    namespace: "/",
    scheme: 'http',
}

const defaultOptions = {
    // socket.io-server options to be passed to socket.io
    // https://socket.io/docs/v4/server-options/
    path: '/socket.io',
    connectTimeout: 5000,
    pingInterval: 10000,
    pingTimeout: 10000,
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
}

// make sure you use socket.io >=4.*
class MYIOServer {
    peers = {}
    admins = {}
    config = {...defaultConfig}
    opts = {...defaultOptions}

    constructor(configuration,opts) {
        this.config = Object.assign({},defaultConfig, configuration)
        this.opts = Object.assign({},defaultOptions,opts)

        // validate configuration at constructor
        if (!this.config.hasOwnProperty('port')) throw new Error('port is not defined')
        if (!this.config.hasOwnProperty('ip')) throw new Error('ip is not defined')
        if (!this.config.hasOwnProperty('name')) throw new Error('name is not defined')
        if (!this.config.hasOwnProperty('output')) throw new Error('output is not defined')
        if (!this.config.hasOwnProperty('namespace')) throw new Error('namespace is not defined')
        if (typeof this.config.namespace !== 'string') throw new Error('namespace must be a string')
        if (!this.config.hasOwnProperty('scheme')) throw new Error('scheme is not defined')
        if (typeof this.config.scheme !== 'string') throw new Error('scheme must be a string')
        if (!['http', 'https'].includes(this.config.scheme)) throw new Error('scheme must be http or https')
        // check port
        if (typeof this.config.port !== 'number') throw new Error('port must be a number')
        if (this.config.port < 1 || this.config.port > 65535) throw new Error('port must be between 1-65535')
        // check ip
        if (typeof this.config.ip !== 'string') throw new Error('ip must be a string')
        if (!validIp(this.config.ip)) throw new Error('ip is not valid')
        // check name
        if (typeof this.config.name !== 'string') throw new Error('name must be a string')
        // check output
        if (typeof this.config.output !== 'boolean') throw new Error('output must be a boolean')
        // check onClientDisconnect
        if (this.config.onClientDisconnect && typeof this.config.onClientDisconnect !== 'function') throw new Error('onClientDisconnect must be a function')
        // check onClientConnect
        if (this.config.onClientConnect && typeof this.config.onClientConnect !== 'function') throw new Error('onClientConnect must be a function')
        // auth.public must be an array
        if (this.config.auth && this.config.auth.public && !Array.isArray(this.config.auth.public)) throw new Error('auth.public must be an array')

        this.#log(`constructor passed`)
    }

    #middleware_isadmin(packet, socket, next, that) {
        // if no auth is set, server is public accessable
        if (!that?.config?.auth) return next()

        const eventName = packet[0]
        // if (['whoami', '__connect'].includes(eventName)) return next()

        const arguments_passed = packet[1];
        const callbackfn = packet?.[2] && typeof packet?.[2] === 'function' ? packet[2] : () => { };

        // some events might be called without authorization if defined in auth.public array
        if (that?.config?.auth?.public?.includes(eventName)) return next()

        let token = socket?.handshake?.auth?.token

        // if we have config.auth defined we will check authorization
        if (token && that.config?.auth?.bytoken?.hasOwnProperty(token)) {
            // now we have the token, lets check if this token has access to this evetName
            let { bytoken } = that.config.auth
            if (bytoken[token]?.permissions?.includes(eventName) || bytoken[token]?.permissions?.includes('*') || eventName === 'whoami') {
                that.#log(`access granted for ${token} towards ${chalk.bgYellow(eventName)}`)
                socket.admin = bytoken[token]
                return next()
            }
        }

        callbackfn({ error: 'not authorized' })
        // that.#log(`authentication`, chalk.red(`failed for event: '${eventName}'`))
        // socket.emit("error.auth", "not authorized")
        socket.disconnect()
    }

    #log(scope, ...str) {
        if (this.config.output)
            console.log(chalk.bgGray(this.config.name), chalk.bgCyan(`socketio-server:${scope}`), ...str)
    }

    async onConnection(that, client) {
        // client based middleware
        client.use((packet, next) => {
            that.#middleware_isadmin(packet, client, next, that)
        })

        const clientid = client.conn.id
        const { headers } = client.handshake

        // determine the IP
        client.ip = false
        if (!client.ip && headers.hasOwnProperty('cf-connecting-ip') && validIp(headers['cf-connecting-ip']))
            client.ip = headers['cf-connecting-ip']

        if (!validIp(client.ip))
            client.ip = headers.hasOwnProperty('x-tha-ip') && validIp(headers['x-tha-ip'])
                ? headers['x-tha-ip']
                : client.handshake.address

        client.browser = headers.hasOwnProperty('user-agent') ? headers['user-agent'] : '-'
        this.#log('onClientConnection', client.ip, clientid, client.handshake.auth?.token ? chalk.gray(client.handshake.auth?.token) : 'no-token')

        // event onClientConnect
        if (this.config.onClientConnect && typeof this.config.onClientConnect === 'function')
            await this.config.onClientConnect(client)

        // event onClientDiscoonect
        client.on('disconnect', async () => {
            this.#log('disconnect', client.ip, clientid)
            if (this.config?.onClientDisconnect && typeof this.config.onClientDisconnect === 'function')
                await this.config.onClientDisconnect(client)
            // disconnects are 2 different
            // one is server initiated which does not cause reconnect (event='io server disconnect')
            // other is transport based (connection drops), they cause to reconnect (event='transport close')
            // if (this.peers.hasOwnProperty(clientid)) delete this.peers[clientid]
            // if (this.admins.hasOwnProperty(clientid)) delete this.admins[clientid]
        });


        client.on('whoami', cb => {
            this.#log(`whoami`, client.ip, clientid)
            if (client.admin) {
                return cb(null, {
                    user: client.admin,
                    ip: client.ip,
                    browser: client.browser,
                    clientid: clientid
                })
            }
            cb('unauthenticated', null)
        })
    }

    launch() {
        return new Promise(async (resolve, reject) => {
            try {
                const http = require('http').Server(app)
                http.on('error', (err) => {
                    if (err.code === 'EADDRINUSE')
                        reject(`port ${this.config.port} is already in use`)
                })
                this.http = http
                const io = socketio(http, this.opts).of(this.config.namespace)
                io.on('connection', (client) =>
                    this.onConnection(this, client)
                )
                
                this.http.listen(this.config.port, this.config.ip, (a, b) => {
                    this.#log(chalk.bold(`socket.io-server (${chalk.yellow(this.config.name)}) listening on ${this.config.ip}:${this.config.port}`))
                    resolve(this)
                })
            } catch (err) {
                reject(err)
            }
        })
    }

    async stop(timeoutSeconds = 5) {
        let sent = false
        return new Promise(async (resolve, reject) => {
            let to = setTimeout(() => {
                if (!sent) {
                    sent = true
                    resolve(false)
                }
            }, timeoutSeconds * 1000)

            if (this?.http?.close && typeof this.http.close === 'function')
                this.http.close(() => {
                    this.#log("stopped")
                    if (!sent) {
                        sent = true
                        resolve(true)
                    }
                    clearTimeout(to)
                })
            else {
                this.#log("was already stopped")
                if (!sent) {
                    sent = true
                    resolve(true)
                    clearTimeout(to)
                }
            }

        })
    }
}

module.exports = { MYIOServer }

