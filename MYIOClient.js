"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MYIOClient = void 0;
const debug_1 = __importDefault(require("debug"));
const socket_io_client_1 = require("socket.io-client");
const ts_1 = require("mybase/ts");
const dbg = (0, debug_1.default)('_MYIOClient');
const defaultClientConfig = {
    name: 'ioclient',
    scheme: 'http',
    hostname: '127.0.0.1',
    port: 7555,
    namespace: "/",
    output: false,
    onConnect: undefined,
    onDisconnect: undefined,
    onError: undefined
};
const defaultOptions = {
    reconnection: true,
    path: '/socket.io',
    forceNew: false,
    autoConnect: true,
    timeout: 5000,
    reconnectionDelayMax: 5000,
    reconnectionDelay: 2000,
};
class MYIOClient {
    constructor(configuration = {}, opts = {}) {
        this.isConnected = false;
        dbg('constructor', configuration, opts);
        this.config = Object.assign(Object.assign({}, defaultClientConfig), configuration);
        this.opts = Object.assign(Object.assign({}, defaultOptions), opts);
        let connectionString = `${this.config.scheme}://${this.config.hostname}:${this.config.port}${this.config.namespace}`;
        if (this.config.url)
            connectionString = this.config.url;
        this.socket = (0, socket_io_client_1.io)(connectionString, this.opts);
        this.socket.on('connect', () => {
            dbg('event:connect');
            if (this.config.onConnect && typeof this.config.onConnect === 'function')
                this.config.onConnect(this);
            this.log('connected');
            this.isConnected = true;
        });
        this.socket.on('disconnect', () => {
            dbg('event:disconnect');
            if (this.config.onDisconnect && typeof this.config.onDisconnect === 'function')
                this.config.onDisconnect(this);
            this.log('disconnected');
            this.isConnected = false;
        });
        this.socket.on('reconnect', () => {
            dbg('event:reconnect');
            this.log('reconnected');
            this.isConnected = true;
        });
        this.socket.on('reconnect_error', (err) => {
            dbg('event:reconnect_error', err);
            this.log('reconnect_error', err);
        });
        this.socket.on('error', (err) => {
            dbg('event:error', err);
            if (this.config.onError && typeof this.config.onError === 'function')
                this.config.onError(err);
            this.log('error', err);
        });
        this.socket.on('reconnect_failed', () => {
            dbg('event:reconnect_failed');
            this.log('reconnect_failed');
        });
        this.socket.on('reconnect_attempt', (attemptNumber) => {
            dbg('event:reconnect_attempt', attemptNumber);
            this.log('reconnect_attempt', attemptNumber);
        });
        this.log(`constructor passed ${connectionString}`);
    }
    log(scope, ...str) {
        if (this.config.output)
            console.log(`socketio-client:${scope}`, `/${this.config.name}${this.opts.path}`, ...str);
    }
    async emitTimeout(timeoutSeconds, ...args) {
        return (0, ts_1.promiseTimeout)(timeoutSeconds * 1000, new Promise((resolve, reject) => {
            if (!this.socket)
                return reject(new Error('Socket not connected'));
            this.socket.emit(args[0], ...args.slice(1), (err, ret) => {
                if (err)
                    return reject(err);
                resolve(ret);
            });
        }));
    }
    async emit(...args) {
        return new Promise((resolve, reject) => {
            dbg('emit', args);
            if (!this.socket)
                return reject(new Error('Socket not connected')); // Add this check
            this.socket.emit(args[0], ...args.slice(1), (err, ret) => {
                dbg('emit', err, ret);
                if (err)
                    return reject(err);
                resolve(ret);
            });
        });
    }
    async whoami(timeoutSeconds = 5) {
        return this.emitTimeout(timeoutSeconds, 'whoami');
    }
    async connect(timeoutSeconds = 5) {
        dbg('connect', timeoutSeconds);
        let started = Date.now();
        while (true) {
            if (this.isConnected) {
                dbg('connect', 'connected');
                return this;
            }
            if (Date.now() - started > timeoutSeconds * 1000)
                return false;
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    }
    disconnect() {
        dbg('disconnect');
        if (this.socket)
            this.socket.disconnect();
    }
}
exports.MYIOClient = MYIOClient;
//# sourceMappingURL=MYIOClient.js.map