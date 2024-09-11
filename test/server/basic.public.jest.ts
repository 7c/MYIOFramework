import { MYIOServer } from "../../MYIOServer"
import { Socket } from 'socket.io';
const { MYIOClient } = require("../../MYIOClient")


const CONFIG = {
    port: 17851,
    name: 'test',
    namespace: '/test',
    output: false,
}

class CustomMYIOServer extends MYIOServer {
    async onConnection(that:MYIOServer, client:Socket) {
        super.onConnection(that, client)
        client.on("echo",(str,cb) => cb(null,str))
    }
}


describe('MYIOServer events on public server', () => {
    it('echo should work', async () => {
        const server = new CustomMYIOServer(CONFIG)
        await server.launch()
        let client = new MYIOClient(CONFIG)
        await client.connect(200)
        await expect(client.emit('echo', 'test')).resolves.toEqual('test')
        client.disconnect()
        await server.stop()
    })  
})
