"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MYIOServer_1 = require("../../MYIOServer");
const ts_1 = require("mybase/ts");
const { MYIOClient } = require("../../MYIOClient");
const TESTPORT = 37866;
it('listen to onClientDisconnect', async () => {
    let onClientDisconnect = jest.fn();
    const server1 = new MYIOServer_1.MYIOServer({ port: TESTPORT, onClientDisconnect });
    await server1.launch();
    let client = new MYIOClient({ port: TESTPORT });
    await client.connect(2);
    client.disconnect();
    await (0, ts_1.wait)(1 / 3);
    expect(onClientDisconnect).toHaveBeenCalled();
    await server1.stop();
});
//# sourceMappingURL=onClientDisconnect.jest.js.map