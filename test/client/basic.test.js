const { wait } = require('mybase')
const { MYIOServer,emitSync } = require("../../MYIOServer")
const { MYIOClient } = require("../../MYIOClient")

const SERVERCONFIG = {
    port: 11850,
    name: 'test',
    namespace: '/test',
    output: false,
}

describe('MYIOClient Basics', () => {
    test('just basic connect and disconnect with onConnect and onDisconnect', async () => {
        let server1 = new MYIOServer(SERVERCONFIG)
        await server1.launch()
        let onConnect = jest.fn()
        let onDisconnect = jest.fn()
        let client = new MYIOClient({...SERVERCONFIG, onConnect, onDisconnect})
        await wait(1/10)
        expect(onConnect).toHaveBeenCalled()
        client.disconnect()
        await wait(1/10)
        expect(onDisconnect).toHaveBeenCalled()
        await server1.stop()
    })

    test('socket.disconnect single & multiple times', async () => {
        let server1 = new MYIOServer(SERVERCONFIG)
        await server1.launch()
        let onDisconnect = jest.fn()
        let client = new MYIOClient({...SERVERCONFIG, onDisconnect})
        await wait(1/10)
        expect(onDisconnect).not.toHaveBeenCalled()
        client.disconnect()
        await wait(1/10)
        expect(onDisconnect).toHaveBeenCalledTimes(1)
        client.disconnect()
        // double disconnect should not not call onDisconnect again
        expect(onDisconnect).toHaveBeenCalledTimes(1)
        await server1.stop()
    })

    test('connect to non-open ports should timeout at connect', async () => {
        let client = new MYIOClient({...SERVERCONFIG})
        await expect(client.connect(2)).resolves.toEqual(false)
    })

    test.only('connect to open ports should not timeout at connect', async () => {
        let server1 = new MYIOServer(SERVERCONFIG)
        await server1.launch()

        let client = new MYIOClient({...SERVERCONFIG})
        await expect(client.connect(10)).resolves.toEqual(true)
        client.disconnect()
        await server1.stop()
    })

})