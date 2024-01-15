const { MYIOServer } = require("../../MYIOServer")
const { MYIOClient } = require("../../MYIOClient")


const CONFIG = {
    port: 17850,
    name: 'test',
    namespace: '/test',
    output: false,
}

class CustomMYIOServer extends MYIOServer {
    onConnection(that, client) {
        super.onConnection(that, client)
        client.on("echo",(str,cb) => cb(null,str))
    }
}


describe('MYIOServer events on public server', () => {
    test('echo', async () => {
        const server = new CustomMYIOServer(CONFIG)
        await server.launch()
        let client = new MYIOClient(CONFIG)
        await client.connect(2)
        await expect(client.emit('echo', 'test')).resolves.toEqual('test')
        client.disconnect()
        await server.stop()
    })  
})
