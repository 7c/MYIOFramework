"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MYIOServer_1 = require("@root/MYIOServer");
const TESTPORT = 7849;
describe('MYIOServer Connections', () => {
    it('basic launch and stop', async () => {
        const server = new MYIOServer_1.MYIOServer({ port: TESTPORT });
        await server.launch();
        await server.stop();
    });
    it("launching 2 seperate servers", async () => {
        const server1 = new MYIOServer_1.MYIOServer({ port: TESTPORT });
        await server1.launch();
        await server1.stop();
        const server2 = new MYIOServer_1.MYIOServer({ port: TESTPORT + 1 });
        await server2.launch();
        await server2.stop();
    });
    it("Launching 2 seperate servers on same port", async () => {
        const server1 = new MYIOServer_1.MYIOServer({ port: TESTPORT });
        await server1.launch();
        const server2 = new MYIOServer_1.MYIOServer({ port: TESTPORT });
        await expect(server2.launch()).rejects.toEqual(`port ${TESTPORT} is already in use`);
        await expect(server2.launch()).rejects.toEqual(`port ${TESTPORT} is already in use`);
        await server1.stop();
        await server2.stop();
    });
});
//# sourceMappingURL=connections.jest.js.map