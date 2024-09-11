import { MYIOServer } from "../../MYIOServer"
import { wait } from 'mybase/ts'
const { MYIOClient } = require("../../MYIOClient")

const TESTPORT = 37866


it('listen to onClientDisconnect', async () => {
    let onClientDisconnect = jest.fn()
    const server1 = new MYIOServer({ port: TESTPORT, onClientDisconnect })
    await server1.launch()
    let client = new MYIOClient({ port: TESTPORT })
    await client.connect(2)
    
    client.disconnect()
    await wait(1 / 3)
    expect(onClientDisconnect).toHaveBeenCalled()
    await server1.stop()
})
