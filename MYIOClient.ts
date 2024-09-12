import debug from 'debug';
import chalk from 'chalk';
import { io, Socket,ManagerOptions,SocketOptions,Manager } from 'socket.io-client';
import { promiseTimeout } from 'mybase/ts';
import { IOServerConfig } from './MYIOServer';

const dbg = debug('_MYIOClient');

export type IOClientConfig = Omit<IOServerConfig, 'ip'> & {
    hostname: string;
    onConnect?: (client: MYIOClient) => Promise<void>;
    onDisconnect?: (client: MYIOClient) => Promise<void>;
    onError?: (err: Error) => Promise<void>;
    url?: string;
}

export type IOClientOptions = Partial<ManagerOptions & SocketOptions>;

const defaultClientConfig: IOClientConfig = {
    name: 'ioclient',
    scheme: 'http',
    hostname: '127.0.0.1',
    port: 7555,
    namespace: "/",
    output: true,
    outputTimestamp: true,
    onConnect: undefined,
    onDisconnect: undefined,
    onError: undefined,
    auth: undefined
};

const defaultClientOptions: IOClientOptions = {
    reconnection: true,
    path: '/socket.io',
    forceNew: false,
    autoConnect: true,
    timeout: 5000,
    reconnectionDelayMax: 5000,
    reconnectionDelay: 2000,
};

export class MYIOClient {
    private socket?: Socket;
    private isConnected: boolean = false;
    public config: IOClientConfig;
    public opts: IOClientOptions;

    constructor(configuration: Partial<IOClientConfig> = {}, opts: IOClientOptions = {}) {
        dbg('constructor', configuration, opts);
        this.config = { ...defaultClientConfig, ...configuration };
        this.opts = { ...defaultClientOptions, ...opts };

        let connectionString = `${this.config.scheme}://${this.config.hostname}:${this.config.port}${this.config.namespace}`;
        if (this.config.url) connectionString = this.config.url;
        this.socket = io(connectionString, this.opts);

        this.socket.on('connect', () => {
            dbg('event:connect');
            if (this.config.onConnect && typeof this.config.onConnect === 'function')
                this.config.onConnect(this);

            this.log(`event:connect`, `connected`);
            this.isConnected = true;
        });

        this.socket.on('disconnect', () => {
            dbg('event:disconnect');
            if (this.config.onDisconnect && typeof this.config.onDisconnect === 'function')
                this.config.onDisconnect(this);

            this.log(`event:disconnect`, `disconnected`);
            this.isConnected = false;
        });

        this.socket.on('reconnect', () => {
            dbg('event:reconnect');
            this.log(`event:reconnect`, `reconnected`);
            this.isConnected = true;
        });

        this.socket.on('reconnect_error', (err: Error) => {
            dbg('event:reconnect_error', err);
            this.log(`event:reconnect_error`, err);
        });

        this.socket.on('error', (err: Error) => {
            dbg('event:error', err);
            if (this.config.onError && typeof this.config.onError === 'function')
                this.config.onError(err);
            this.log(`event:error`, err);
        });

        this.socket.on('reconnect_failed', () => {
            dbg('event:reconnect_failed');
            this.log(`event:reconnect_failed`);
        });

        this.socket.on('reconnect_attempt', (attemptNumber: number) => {
            dbg('event:reconnect_attempt', attemptNumber);
            this.log(`event:reconnect_attempt`, attemptNumber);
        });

        this.log(`constructor`, `${connectionString} namespace:${this.config.namespace} token:${this.config.auth?.token||'none'}`);
    }

    private log(scope: string, ...str: any[]) {
        if (this.config.output) {
            const timestamp = this.config.outputTimestamp ? chalk.gray(`[${new Date().toISOString()}]`) : '';   
            console.log(timestamp, chalk.bgGreenBright(this.config.name), chalk.cyan(`socketio-client:${chalk.bold(scope)}:`), ...str);
        }
    }

    async emitTimeout(timeoutSeconds: number, ...args: any[]): Promise<any> {
        return promiseTimeout(timeoutSeconds * 1000, new Promise((resolve, reject) => {
            this.log(`emitTimeout`, timeoutSeconds, args);
            dbg('emitTimeout', args);
            if (!this.socket) return reject(new Error('Socket not connected'));
            this.socket.emit(args[0], ...args.slice(1), (err: Error, ret: any) => {
                dbg(`emitTimeout`, err, ret);
                if (err) {
                    this.log(`emitTimeout`, `error`, err);
                    return reject(err);
                }
                this.log(`emitTimeout`, `success`, ret);    
                resolve(ret);
            });
        }));
    }

    async emit(...args: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            this.log('emit', args);
            dbg('emit', args);
            if (!this.socket) {
                this.log('emit', 'Socket not connected');
                return reject(new Error('Socket not connected')); // Add this check
            }
            this.log('emit', 'emitting', args,this.socket.id);
            this.socket.emit(args[0], ...args.slice(1), (err: Error, ret: any) => {
                dbg('emit', err, ret);
                this.log('emit', err, ret);
                if (err) return reject(err);
                resolve(ret);
            });
        });
    }

    async whoami(timeoutSeconds: number = 5): Promise<any> {
        return this.emitTimeout(timeoutSeconds, 'whoami');
    }

    async connect(timeoutSeconds: number = 5): Promise<this | false> {
        dbg('connect', timeoutSeconds);
        let started = Date.now();
        while (true) {
            if (this.isConnected) {
                dbg('connect', 'connected');
                this.log('connect', 'connected');
                return this;
            }
            if (Date.now() - started > timeoutSeconds * 1000) {
                this.log('connect', 'timeout');
                return false;
            }
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    }

    disconnect() {
        dbg('disconnect');
        this.log('disconnect');
        if (this.socket) this.socket.disconnect();
    }
}

