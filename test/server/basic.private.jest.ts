import { MYIOServer } from "../../MYIOServer"   
import { Socket } from 'socket.io';
import { MYIOClient } from "../../MYIOClient"
const output = true

const CONFIG = {
    port: 27852,
    name: 'private',
    namespace: '/private',
    output,
    auth: {
        public: ['publicecho'],
        bytoken: {
            "admin1": {
                name: 'administrator 1',
                permissions: ['privateecho']
            }
        }
    },
}

class CustomMYIOServer extends MYIOServer {
    async onConnection(that:MYIOServer, client:Socket) {
        super.onConnection(that, client)
        client.on("privateecho", (str:string, cb:Function) =>  cb(null, str))
        client.on("publicecho", (str, cb) => cb(null, str))
    }
}

describe('MYIOServer as private server', () => {
    test('privateecho should require authorization and denied to be called', async () => {
        const server = new CustomMYIOServer(CONFIG)
        await server.launch()
        const client = new MYIOClient(CONFIG)
        await client.connect(2)
        await expect(client.emitTimeout(1, 'privateecho', 'test')).rejects.toEqual({ error: "not authorized" })
        client.disconnect()
        await server.stop()
    })

    test('publicecho should still be public even though authorization is enabled', async () => {
        const server = new CustomMYIOServer({...CONFIG,port:CONFIG.port+1})
        await server.launch()
        const client = new MYIOClient({...CONFIG,port:CONFIG.port+1})
        await client.connect(2)
        await expect(client.emitTimeout(1, 'publicecho', 'test')).resolves.toEqual('test')
        client.disconnect()
        await server.stop()
    })

    test('privateecho should be able to called when authorized bytoken', async () => {
        const server = new CustomMYIOServer({...CONFIG,port:CONFIG.port+4})
        await server.launch()        
        let client = new MYIOClient({...CONFIG,port:CONFIG.port+4},{auth:{token:'admin1'}})
        await client.connect(2)
        await expect(client.emitTimeout(1, 'privateecho', 'test')).resolves.toEqual('test')
        client.disconnect()
        await server.stop()
    })

    
})
