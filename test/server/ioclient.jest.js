"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MYIOServer_1 = require("../../MYIOServer");
const MYIOClient_1 = require("../../MYIOClient");
const TESTPORT = 7849;
class CustomMYIOServer extends MYIOServer_1.MYIOServer {
    async onConnection(that, client) {
        super.onConnection(that, client);
        client.on("echo", (str, cb) => cb(null, str));
    }
}
describe('MYIOServer IOClient', () => {
    it('every server should be able to create client and connect to server', async () => {
        const server = new MYIOServer_1.MYIOServer({ port: TESTPORT });
        await server.launch();
        const client = server.IOClient();
        expect(client).toBeDefined();
        expect(await client.connect()).toBeInstanceOf(MYIOClient_1.MYIOClient);
        client.disconnect();
        await server.stop();
    });
    it('should also work with different namespace', async () => {
        const server = new MYIOServer_1.MYIOServer({ port: TESTPORT + 1, namespace: '/test' });
        await server.launch();
        const client = server.IOClient();
        expect(client).toBeDefined();
        expect(await client.connect()).toBeInstanceOf(MYIOClient_1.MYIOClient);
        client.disconnect();
        await server.stop();
    });
    it('should be able to call the event', async () => {
        const server = new CustomMYIOServer({ port: TESTPORT + 2 });
        await server.launch();
        const client = server.IOClient();
        expect(client).toBeDefined();
        expect(await client.connect()).toBeInstanceOf(MYIOClient_1.MYIOClient);
        await expect(client.emit('echo', 'test')).resolves.toEqual('test');
        client.disconnect();
        await server.stop();
    });
});
//# sourceMappingURL=IOClient.jest.js.map