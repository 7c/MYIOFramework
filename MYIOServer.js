"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MYIOServer = exports.defaultIOServerOptions = exports.defaultIOServerConfig = void 0;
const debug_1 = __importDefault(require("debug"));
const express_1 = __importDefault(require("express"));
const MYIOClient_1 = require("./MYIOClient");
const chalk_1 = __importDefault(require("chalk"));
const socket_io_1 = require("socket.io");
const ts_1 = require("mybase/ts");
const dbg = (0, debug_1.default)('_MYIOServer');
exports.defaultIOServerConfig = {
    port: 7555,
    ip: '127.0.0.1',
    name: 'ioserver',
    output: false,
    namespace: "/",
    scheme: 'http',
};
exports.defaultIOServerOptions = {
    path: '/socket.io',
    connectTimeout: 5000,
    pingInterval: 10000,
    pingTimeout: 10000,
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
};
class MYIOServer {
    constructor(configuration = {}, opts = {}) {
        // so we can store the connected clients
        this.peers = {};
        this.admins = {};
        dbg('constructor', configuration, opts);
        this.config = Object.assign(Object.assign({}, exports.defaultIOServerConfig), configuration);
        this.opts = Object.assign(Object.assign({}, exports.defaultIOServerOptions), opts);
        // validate configuration at constructor
        if (!this.config.hasOwnProperty('port'))
            throw new Error('port is not defined');
        if (!this.config.hasOwnProperty('ip'))
            throw new Error('ip is not defined');
        if (!this.config.hasOwnProperty('name'))
            throw new Error('name is not defined');
        if (!this.config.hasOwnProperty('output'))
            throw new Error('output is not defined');
        if (!this.config.hasOwnProperty('namespace'))
            throw new Error('namespace is not defined');
        if (typeof this.config.namespace !== 'string')
            throw new Error('namespace must be a string');
        if (!this.config.hasOwnProperty('scheme'))
            throw new Error('scheme is not defined');
        if (typeof this.config.scheme !== 'string')
            throw new Error('scheme must be a string');
        if (!['http', 'https'].includes(this.config.scheme))
            throw new Error('scheme must be http or https');
        // check port
        if (typeof this.config.port !== 'number')
            throw new Error('port must be a number');
        if (this.config.port < 1 || this.config.port > 65535)
            throw new Error('port must be between 1-65535');
        // check ip
        if (typeof this.config.ip !== 'string')
            throw new Error('ip must be a string');
        if (!(0, ts_1.validIp)(this.config.ip))
            throw new Error('ip is not valid');
        // check name
        if (typeof this.config.name !== 'string')
            throw new Error('name must be a string');
        // check output
        if (typeof this.config.output !== 'boolean')
            throw new Error('output must be a boolean');
        // check onClientDisconnect
        if (this.config.onClientDisconnect && typeof this.config.onClientDisconnect !== 'function')
            throw new Error('onClientDisconnect must be a function');
        // check onClientConnect
        if (this.config.onClientConnect && typeof this.config.onClientConnect !== 'function')
            throw new Error('onClientConnect must be a function');
        // auth.public must be an array
        if (this.config.auth && this.config.auth.public && !Array.isArray(this.config.auth.public))
            throw new Error('auth.public must be an array');
        this.log(`constructor passed`);
    }
    middlewareIsAdmin(packet, socket, next, that) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
        // if no auth is set, server is public accessible
        if (!((_a = that === null || that === void 0 ? void 0 : that.config) === null || _a === void 0 ? void 0 : _a.auth))
            return next();
        const eventName = packet[0];
        const argumentsPassed = packet[1];
        const callbackfn = (packet === null || packet === void 0 ? void 0 : packet[2]) && typeof (packet === null || packet === void 0 ? void 0 : packet[2]) === 'function' ? packet[2] : () => { };
        // some events might be called without authorization if defined in auth.public array
        if ((_d = (_c = (_b = that === null || that === void 0 ? void 0 : that.config) === null || _b === void 0 ? void 0 : _b.auth) === null || _c === void 0 ? void 0 : _c.public) === null || _d === void 0 ? void 0 : _d.includes(eventName))
            return next();
        let token = (_f = (_e = socket === null || socket === void 0 ? void 0 : socket.handshake) === null || _e === void 0 ? void 0 : _e.auth) === null || _f === void 0 ? void 0 : _f.token;
        // if we have config.auth defined we will check authorization
        if (token && ((_j = (_h = (_g = that.config) === null || _g === void 0 ? void 0 : _g.auth) === null || _h === void 0 ? void 0 : _h.bytoken) === null || _j === void 0 ? void 0 : _j.hasOwnProperty(token))) {
            // now we have the token, lets check if this token has access to this eventName
            let { bytoken } = that.config.auth;
            if (((_l = (_k = bytoken[token]) === null || _k === void 0 ? void 0 : _k.permissions) === null || _l === void 0 ? void 0 : _l.includes(eventName)) || ((_o = (_m = bytoken[token]) === null || _m === void 0 ? void 0 : _m.permissions) === null || _o === void 0 ? void 0 : _o.includes('*')) || eventName === 'whoami') {
                that.log(`access granted for ${token} towards ${chalk_1.default.bgYellow(eventName)}`);
                socket.admin = bytoken[token];
                return next();
            }
        }
        callbackfn({ error: 'not authorized' });
        socket.disconnect();
    }
    log(scope, ...str) {
        if (this.config.output)
            console.log(chalk_1.default.bgGray(this.config.name), chalk_1.default.cyan(`socketio-server:${scope}`), ...str);
    }
    async onConnection(that, client) {
        var _a, _b;
        // client based middleware
        client.use((packet, next) => {
            that.middlewareIsAdmin(packet, client, next, that);
        });
        const clientid = client.id;
        const { headers } = client.handshake;
        // determine the IP
        client.ip = undefined;
        if (!client.ip && headers.hasOwnProperty('cf-connecting-ip') && (0, ts_1.validIp)(headers['cf-connecting-ip']))
            client.ip = headers['cf-connecting-ip'];
        if (!client.ip)
            client.ip = headers.hasOwnProperty('x-tha-ip') && (0, ts_1.validIp)(headers['x-tha-ip'])
                ? headers['x-tha-ip']
                : client.handshake.address;
        client.browser = headers.hasOwnProperty('user-agent') ? headers['user-agent'] : '-';
        this.log('onClientConnection', client.ip, clientid, ((_a = client.handshake.auth) === null || _a === void 0 ? void 0 : _a.token) ? chalk_1.default.gray((_b = client.handshake.auth) === null || _b === void 0 ? void 0 : _b.token) : 'no-token');
        // event onClientConnect
        if (this.config.onClientConnect && typeof this.config.onClientConnect === 'function')
            await this.config.onClientConnect(client);
        // event onClientDisconnect
        client.on('disconnect', async () => {
            var _a;
            this.log('disconnect', client.ip, clientid);
            if (((_a = this.config) === null || _a === void 0 ? void 0 : _a.onClientDisconnect) && typeof this.config.onClientDisconnect === 'function')
                await this.config.onClientDisconnect(client);
        });
        client.on('whoami', cb => {
            this.log(`whoami`, client.ip, clientid);
            if (client.admin) {
                return cb(null, {
                    user: client.admin,
                    ip: client.ip,
                    browser: client.browser,
                    clientid: clientid
                });
            }
            cb('unauthenticated', null);
        });
    }
    async launch() {
        return new Promise(async (resolve, reject) => {
            try {
                const app = (0, express_1.default)();
                const http = require('http').Server(app);
                http.on('error', (err) => {
                    dbg('error', err);
                    if (err.code === 'EADDRINUSE')
                        reject(`port ${this.config.port} is already in use`);
                });
                this.http = http;
                const io = new socket_io_1.Server(http, this.opts).of(this.config.namespace);
                io.on('connection', (client) => {
                    dbg('connection', client.id);
                    this.log('connection', client.id);
                    this.onConnection(this, client);
                });
                this.http.listen(this.config.port, this.config.ip, () => {
                    dbg('listen', this.config.ip, this.config.port);
                    this.log(chalk_1.default.bold(`socket.io-server (${chalk_1.default.yellow(this.config.name)}) listening on ${this.config.ip}:${this.config.port}`));
                    resolve(this);
                });
            }
            catch (err) {
                this.log('error', err);
                dbg('error', err);
                reject(err);
            }
        });
    }
    async stop(timeoutSeconds = 5) {
        let sent = false;
        return new Promise(async (resolve, reject) => {
            var _a;
            let to = setTimeout(() => {
                if (!sent) {
                    sent = true;
                    resolve(false);
                }
            }, timeoutSeconds * 1000);
            if (((_a = this === null || this === void 0 ? void 0 : this.http) === null || _a === void 0 ? void 0 : _a.close) && typeof this.http.close === 'function')
                this.http.close(() => {
                    this.log("stopped");
                    if (!sent) {
                        sent = true;
                        resolve(true);
                    }
                    clearTimeout(to);
                });
            else {
                this.log("was already stopped");
                if (!sent) {
                    sent = true;
                    resolve(true);
                    clearTimeout(to);
                }
            }
        });
    }
    IOClient() {
        const configuration = {
            scheme: this.config.scheme,
            hostname: this.config.ip,
            port: this.config.port,
            namespace: this.config.namespace,
        };
        return new MYIOClient_1.MYIOClient(configuration, this.opts);
    }
}
exports.MYIOServer = MYIOServer;
//# sourceMappingURL=MYIOServer.js.map