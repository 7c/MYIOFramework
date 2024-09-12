import debug from 'debug';
import express from 'express';
import { MYIOClient } from "./MYIOClient"
import chalk from 'chalk';
import { Server, ServerOptions, Socket } from 'socket.io';
import { validIp } from 'mybase/ts'
import { IOClientOptions, IOClientConfig } from './MYIOClient';
const dbg = debug('_MYIOServer');
// dbg.enabled = typeof jest !== 'undefined';




export interface IOServerConfig {
    // listen on port
    port: number;
    // listen on ip
    ip: string;

    name: string;
    output: boolean;
    outputTimestamp: boolean;
    onClientDisconnect?: (client: Socket) => Promise<void>;
    onClientConnect?: (client: Socket) => Promise<void>;
    namespace: string;
    scheme: 'http' | 'https';
    auth?: {
        token?: string; // for client connection
        public?: string[];
        bytoken?: {
            [key: string]: {
                name: string;
                permissions: string[];
            };
        };
    };
}

export interface IOServerOptions extends ServerOptions {
    path: string;
    connectTimeout: number;
    pingInterval: number;
    pingTimeout: number;
    cors: {
        origin: string;
        methods: string[];
    };
}

export const defaultIOServerConfig: IOServerConfig = {
    port: 7555,
    ip: '127.0.0.1',
    name: 'ioserver',
    output: true,
    outputTimestamp: true,
    namespace: "/socket.io",
    scheme: 'http',
}

export const defaultIOServerOptions: Partial<IOServerOptions> = {
    path: '/socket.io',
    connectTimeout: 5000,
    pingInterval: 10000,
    pingTimeout: 10000,
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
}

export class MYIOServer {
    // so we can store the connected clients
    protected peers: { [key: string]: any } = {}
    protected admins: { [key: string]: any } = {}
    protected http?: any;

    public config: IOServerConfig;
    public opts: Partial<IOServerOptions>;

    constructor(configuration: Partial<IOServerConfig> = {}, opts: Partial<IOServerOptions> = {}) {
        dbg('constructor', configuration, opts);
        this.config = { ...defaultIOServerConfig, ...configuration };
        this.opts = { ...defaultIOServerOptions, ...opts };

        // validate configuration at constructor
        if (!this.config.hasOwnProperty('port')) throw new Error('port is not defined');
        if (!this.config.hasOwnProperty('ip')) throw new Error('ip is not defined');
        if (!this.config.hasOwnProperty('name')) throw new Error('name is not defined');
        if (!this.config.hasOwnProperty('output')) throw new Error('output is not defined');
        if (!this.config.hasOwnProperty('namespace')) throw new Error('namespace is not defined');
        if (typeof this.config.namespace !== 'string') throw new Error('namespace must be a string');
        if (!this.config.hasOwnProperty('scheme')) throw new Error('scheme is not defined');
        if (typeof this.config.scheme !== 'string') throw new Error('scheme must be a string');
        if (!['http', 'https'].includes(this.config.scheme)) throw new Error('scheme must be http or https');
        // check port
        if (typeof this.config.port !== 'number') throw new Error('port must be a number');
        if (this.config.port < 1 || this.config.port > 65535) throw new Error('port must be between 1-65535');
        // check ip
        if (typeof this.config.ip !== 'string') throw new Error('ip must be a string');
        if (!validIp(this.config.ip)) throw new Error('ip is not valid');
        // check name
        if (typeof this.config.name !== 'string') throw new Error('name must be a string');
        // check output
        if (typeof this.config.output !== 'boolean') throw new Error('output must be a boolean');
        // check onClientDisconnect
        if (this.config.onClientDisconnect && typeof this.config.onClientDisconnect !== 'function') throw new Error('onClientDisconnect must be a function');
        // check onClientConnect
        if (this.config.onClientConnect && typeof this.config.onClientConnect !== 'function') throw new Error('onClientConnect must be a function');
        // auth.public must be an array
        if (this.config.auth && this.config.auth.public && !Array.isArray(this.config.auth.public)) throw new Error('auth.public must be an array');

        this.log('constructor',`success`);
    }

    private middlewareIsAdmin(packet: any[], socket: Socket, next: (err?: any) => void, that: MYIOServer) {
        
        const eventName = packet[0];
        const argumentsPassed = packet[1];
        const callbackfn = packet?.[2] && typeof packet?.[2] === 'function' ? packet[2] : () => { };
        
        dbg(`middlewareIsAdmin`,eventName)
        // if no auth is set, server is public accessible
        if (!that?.config?.auth) {
            that.log(`request ${chalk.bgYellow(eventName)}: granted ${chalk.red('without auth')}`,argumentsPassed);
            return next();
        }

        
        

        // some events might be called without authorization if defined in auth.public array
        if (that?.config?.auth?.public?.includes(eventName)) {
            that.log(`request ${chalk.bgYellow(eventName)}: granted ${chalk.green('without auth')}`);
            return next();
        }

        const token = socket?.handshake?.auth?.token;
        // console.log(`handshake`, socket?.handshake)
        // console.log(`packet`, packet)
        // console.log(`argumentsPassed: '${argumentsPassed}' type: ${typeof argumentsPassed}`)
        // console.log(`callbackfn: ${callbackfn} type: ${typeof callbackfn}`)
        // if we have config.auth defined we will check authorization
        if (token && that.config?.auth?.bytoken?.hasOwnProperty(token)) {
            // now we have the token, lets check if this token has access to this eventName
            let { bytoken } = that.config.auth;
            if (bytoken[token]?.permissions?.includes(eventName) || bytoken[token]?.permissions?.includes('*') || eventName === 'whoami') {
                that.log(`request`,`${chalk.bgYellow(eventName)}: granted with token ${chalk.green(token)}`);
                socket.admin = bytoken[token];
                return next();
            }
        }
        this.log(`request`,`${chalk.bgYellow(eventName)}: ${chalk.red('denied')} with token '${chalk.bold(token)}'`);
        callbackfn({ error: 'not authorized' });
        socket.disconnect();
    }

    private log(scope: string, ...str: any[]) {
        if (this.config.output) {
            const timestamp = this.config.outputTimestamp ? chalk.gray(`[${new Date().toISOString()}]`) : '';   
            console.log(timestamp, chalk.bgGray(this.config.name), chalk.cyan(`socketio-server:${chalk.bold(scope)}:`), ...str);
        }
            
    }

    async onConnection(that: MYIOServer, client: Socket) {
        // client based middleware
        client.use((packet, next) => {
            that.middlewareIsAdmin(packet, client, next, that);
        });

        const clientid = client.id
        const { headers } = client.handshake;

        // determine the IP - needs improvement! we should not trust the headers
        client.ip = undefined;

        if (!client.ip && headers.hasOwnProperty('cf-connecting-ip') && validIp(headers['cf-connecting-ip'] as string))
            client.ip = headers['cf-connecting-ip'] as string;

        if (!client.ip)
            client.ip = headers.hasOwnProperty('x-tha-ip') && validIp(headers['x-tha-ip'] as string)
                ? headers['x-tha-ip'] as string
                : client.handshake.address;

        client.browser = headers.hasOwnProperty('user-agent') ? headers['user-agent'] : '-';
        this.log('onClientConnection', client.ip, clientid, client.handshake.auth?.token ? chalk.gray(client.handshake.auth?.token) : 'no-token');

        // event onClientConnect
        if (this.config.onClientConnect && typeof this.config.onClientConnect === 'function')
            await this.config.onClientConnect(client);

        // event onClientDisconnect
        client.on('disconnect', async () => {
            this.log('disconnect', client.ip, clientid);
            if (this.config?.onClientDisconnect && typeof this.config.onClientDisconnect === 'function')
                await this.config.onClientDisconnect(client);
        });

        // built in event whoami
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

    async launch(): Promise<MYIOServer> {
        return new Promise(async (resolve, reject) => {
            try {
                const app = express();
                const http = require('http').Server(app);
                http.on('error', (err: any) => {
                    dbg('error', err)
                    if (err.code === 'EADDRINUSE')
                        reject(`port ${this.config.port} is already in use`);
                });
                this.http = http;
                const io = new Server(http, this.opts).of(this.config.namespace);

                io.on('connection', (client: Socket) => {
                    dbg('connection', client.id)
                    this.log('connection', `new connection: ${client.id}`)
                    this.onConnection(this, client)
                });

                this.http.listen(this.config.port, this.config.ip, () => {
                    dbg('listen', this.config.ip, this.config.port)
                    this.log(`startup`,`listening on ${this.config.ip}:${this.config.port} namespace:${this.config.namespace}`);
                    resolve(this);
                });
            } catch (err) {
                this.log('error', err)
                dbg('error', err)
                reject(err);
            }
        });
    }

    async stop(timeoutSeconds = 5): Promise<boolean> {
        let sent = false;
        return new Promise(async (resolve, reject) => {
            let to = setTimeout(() => {
                if (!sent) {
                    sent = true;
                    resolve(false);
                }
            }, timeoutSeconds * 1000);

            if (this?.http?.close && typeof this.http.close === 'function')
                this.http.close(() => {
                    this.log("stop","stopped");
                    if (!sent) {
                        sent = true;
                        resolve(true);
                    }
                    clearTimeout(to);
                });
            else {
                this.log("stop","was already stopped");
                if (!sent) {
                    sent = true;
                    resolve(true);
                    clearTimeout(to);
                }
            }
        });
    }

    IOClient(configPartial: Partial<IOClientConfig> = {}, clientOptions: IOClientOptions = {}): MYIOClient {
        dbg(`IOClient acquired`)
        const configuration: Partial<IOClientConfig> ={
            scheme: this.config.scheme,
            hostname: this.config.ip,
            port: this.config.port,
            namespace: this.config.namespace,
            auth: undefined,
            ...configPartial,
        }
        return new MYIOClient(configuration, clientOptions)
    }
}



