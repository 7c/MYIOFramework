import { MYIOServer } from "../../MYIOServer"
import { MYIOClient } from "../../MYIOClient"

const SERVERCONFIG = {
    port: 11851,
    name: 'test',
    namespace: '/test',
    output: false,
}

const SERVEROPTIONS = {
    path: '/socket5.io'
}

describe('MYIOClient Advanced', () => {
    test('Try to communicate through different paths with server', async () => {
        let server1 = new MYIOServer(SERVERCONFIG,SERVEROPTIONS)
        expect(await server1.launch()).toBeInstanceOf(MYIOServer)
        let client = server1.IOClient()
        // let client = new MYIOClient(SERVERCONFIG,SERVEROPTIONS)
        expect(await client.connect(2)).toBeInstanceOf(MYIOClient)
        await expect(client.whoami(2)).rejects.toEqual("unauthenticated")
        client.disconnect()
        await server1.stop()
    })

    test('if path does not match we should not be able to communicate even though port is open', async () => {
        let server1 = new MYIOServer({...SERVERCONFIG,port:SERVERCONFIG.port+1},SERVEROPTIONS)
        await server1.launch()
        let client = new MYIOClient({...SERVERCONFIG,port:SERVERCONFIG.port+1},{})
        await expect(client.connect(2)).resolves.toEqual(false)
        await expect(client.whoami(2)).rejects.toEqual('TIMEDOUT')
        
        client.disconnect()
        await server1.stop()

    })
})