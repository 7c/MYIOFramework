import { MYIOServer } from "@root/MYIOServer"
const { MYIOClient } = require("../../MYIOClient")
const TESTPORT = 7860

test('listen to onClientConnect', async () => {
    let onClientConnect = jest.fn()
    const server1 = new MYIOServer({ port: TESTPORT, onClientConnect })
    await server1.launch()

    let client = new MYIOClient({ port: TESTPORT })
    await client.connect(2)
    client.disconnect()
    expect(onClientConnect).toHaveBeenCalled()
    await server1.stop()
})
