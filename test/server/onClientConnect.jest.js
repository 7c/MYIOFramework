"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MYIOServer_1 = require("@root/MYIOServer");
const { MYIOClient } = require("../../MYIOClient");
const TESTPORT = 7860;
test('listen to onClientConnect', async () => {
    let onClientConnect = jest.fn();
    const server1 = new MYIOServer_1.MYIOServer({ port: TESTPORT, onClientConnect });
    await server1.launch();
    let client = new MYIOClient({ port: TESTPORT });
    await client.connect(2);
    client.disconnect();
    expect(onClientConnect).toHaveBeenCalled();
    await server1.stop();
});
//# sourceMappingURL=onClientConnect.jest.js.map