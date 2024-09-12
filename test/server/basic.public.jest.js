"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MYIOServer_1 = require("../../MYIOServer");
const { MYIOClient } = require("../../MYIOClient");
const output = true;
const CONFIG = {
    port: 17851,
    name: 'test',
    namespace: '/test',
    output,
};
class CustomMYIOServer extends MYIOServer_1.MYIOServer {
    async onConnection(that, client) {
        super.onConnection(that, client);
        client.on("echo", (str, cb) => cb(null, str));
    }
}
describe('MYIOServer events on public server', () => {
    it('echo should work', async () => {
        const server = new CustomMYIOServer(CONFIG);
        await server.launch();
        let client = new MYIOClient(CONFIG);
        await client.connect(200);
        await expect(client.emit('echo', 'test')).resolves.toEqual('test');
        client.disconnect();
        await server.stop();
    });
});
//# sourceMappingURL=basic.public.jest.js.map