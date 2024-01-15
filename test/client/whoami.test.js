const { MYIOServer,emitSync } = require("../../MYIOServer")
const { MYIOClient } = require("../../MYIOClient")

const SERVERCONFIG = {
    port: 21652,
    name: 'private',
    namespace: '/private',
    output: false,
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
    onConnection(that, client) {
        super.onConnection(that, client)
        client.on("privateecho", (str, cb) =>  cb(null, str))
        client.on("publicecho", (str, cb) => cb(null, str))
    }
}

describe('MYIOClient', () => {
    test('whoami function', async () => {
        let server1 = new CustomMYIOServer(SERVERCONFIG)
        await server1.launch()
        let client = new MYIOClient(SERVERCONFIG,{auth:{token:'admin1'}})
        await client.connect(2)
        await expect(client.emit('privateecho',"test")).resolves.toEqual('test')
        let whoami = await client.whoami(2)
        expect(whoami).toHaveProperty('user.name','administrator 1')
        expect(whoami).toHaveProperty('ip')
        expect(whoami).toHaveProperty('browser')
        expect(whoami).toHaveProperty('clientid')
        client.disconnect()
        await server1.stop()
    })

})