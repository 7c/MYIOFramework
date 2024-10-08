"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MYIOServer_1 = require("../../MYIOServer");
const MYIOClient_1 = require("../../MYIOClient");
const SERVERCONFIG = {
    port: 21852,
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
};
class CustomMYIOServer extends MYIOServer_1.MYIOServer {
    async onConnection(that, client) {
        super.onConnection(that, client);
        client.on("privateecho", (str, cb) => cb(null, str));
        client.on("publicecho", (str, cb) => cb(null, str));
    }
}
describe('MYIOClient Authenticated', () => {
    test('just basic connect and disconnect to a public function', async () => {
        let server1 = new CustomMYIOServer(SERVERCONFIG);
        await server1.launch();
        let client = new MYIOClient_1.MYIOClient(SERVERCONFIG);
        await client.connect(2);
        await expect(client.emit('publicecho', "test")).resolves.toEqual('test');
        client.disconnect();
        await server1.stop();
    });
    test('calls to a private function should be denied if not authorized', async () => {
        let server1 = new CustomMYIOServer(SERVERCONFIG);
        await server1.launch();
        let client = new MYIOClient_1.MYIOClient(SERVERCONFIG);
        await client.connect(2);
        await expect(client.emit('privateecho', "test")).rejects.toEqual({ error: "not authorized" });
        client.disconnect();
        await server1.stop();
    });
    test('calls to a private function should be granted if authorized', async () => {
        let server1 = new CustomMYIOServer(SERVERCONFIG);
        await server1.launch();
        let client = new MYIOClient_1.MYIOClient(SERVERCONFIG, { auth: { token: 'admin1' } });
        await client.connect(2);
        await expect(client.emit('privateecho', "test")).resolves.toEqual('test');
        client.disconnect();
        await server1.stop();
    });
});
//# sourceMappingURL=auth.jest.js.map