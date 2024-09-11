"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MYIOServer_1 = require("../../MYIOServer");
const MYIOClient_1 = require("../../MYIOClient");
const ts_1 = require("mybase/ts");
const SERVERCONFIG = {
    port: 11850,
    name: 'test',
    namespace: '/test',
    output: false,
};
describe('MYIOClient Basics', () => {
    test('just basic connect and disconnect with onConnect and onDisconnect', async () => {
        let server1 = new MYIOServer_1.MYIOServer(SERVERCONFIG);
        await server1.launch();
        let onConnect = jest.fn();
        let onDisconnect = jest.fn();
        let client = new MYIOClient_1.MYIOClient(Object.assign(Object.assign({}, SERVERCONFIG), { onConnect, onDisconnect }));
        await client.connect(2);
        expect(onConnect).toHaveBeenCalled();
        client.disconnect();
        await (0, ts_1.wait)(1 / 10);
        expect(onDisconnect).toHaveBeenCalled();
        await server1.stop();
    });
    test('socket.disconnect single & multiple times', async () => {
        let server1 = new MYIOServer_1.MYIOServer(SERVERCONFIG);
        await server1.launch();
        let onDisconnect = jest.fn();
        let client = new MYIOClient_1.MYIOClient(Object.assign(Object.assign({}, SERVERCONFIG), { onDisconnect }));
        await client.connect(2);
        expect(onDisconnect).not.toHaveBeenCalled();
        client.disconnect();
        await (0, ts_1.wait)(1 / 10);
        expect(onDisconnect).toHaveBeenCalledTimes(1);
        client.disconnect();
        // double disconnect should not not call onDisconnect again
        expect(onDisconnect).toHaveBeenCalledTimes(1);
        await server1.stop();
    });
    test('connect to non-open ports should timeout at connect', async () => {
        let client = new MYIOClient_1.MYIOClient(Object.assign({}, SERVERCONFIG));
        expect(await client.connect(2)).toBe(false);
    });
    test('connect to open ports should not timeout at connect', async () => {
        let server1 = new MYIOServer_1.MYIOServer(SERVERCONFIG);
        await server1.launch();
        let client = new MYIOClient_1.MYIOClient(Object.assign({}, SERVERCONFIG));
        expect(await client.connect(10)).toBeInstanceOf(MYIOClient_1.MYIOClient);
        client.disconnect();
        await server1.stop();
    });
});
//# sourceMappingURL=basic.jest.js.map