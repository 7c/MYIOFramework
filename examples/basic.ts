import { MYIOServer,IOServerConfig,IOServerOptions } from '../MYIOServer';
import { Socket } from 'socket.io';
import chalk from 'chalk';

class CustomMYIOServer extends MYIOServer {
    async onConnection(that: MYIOServer, client: Socket) {
        super.onConnection(that, client)
        client.on("privateecho", (str: string, cb: Function) => {
            console.log("privateecho", str,cb)
            cb(null, str)
        })
        client.on("publicecho", (str: string, cb: any) => cb(null, str))
        client.on("disconnect", () => {
            console.log("client disconnected")
        })
    }
}

const server_config:IOServerConfig = {
    scheme: 'http', // default
    ip:'127.0.0.1', // default
    namespace: '/demo',
    output: true, // default
    outputTimestamp: true, // default
    
    name: 'demo-server',
    port: 13000,

    // if auth is defined, then all the events will be authenticated expect the ones defined in public array
    auth: {
        public: ['publicecho'],
        bytoken: {
            'cbf4175f-40ce-4dce-b9b8-9b44f3119107': {
                name: 'administrator 1',
                permissions: ['privateecho']
            }
        }
    },
    // if auth is not defined, then all events are public! 
}

const server_opts:Partial<IOServerOptions> = {
    // path:'/socket.io',
}

const server = new CustomMYIOServer(server_config, server_opts)

async function main() {
    try {
        await server.launch()
        console.log("server launched successfully")
        const client = server.IOClient({ name: 'demo-client'}, { auth: { token: 'cbf4175f-40ce-4dce-b9b8-9b44f3119107' } })
        await client.connect(2)
        console.log("client connected successfully")
        const resultPrivateEcho = await client.emitTimeout(2,'privateecho', 'hello')
        console.log("result of private echo:", resultPrivateEcho)
        const resultPublicEcho = await client.emitTimeout(2,'publicecho', 'hello')
        console.log("result of public echo:", resultPublicEcho)
        client.disconnect()
        console.log("client disconnected")
        await server.stop()
        console.log("server stopped successfully")
        process.exit(0)
    } catch (error) {
        console.error(chalk.redBright("error:"), error)
        process.exit(1)
    }
}

main()
