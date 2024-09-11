import { MYIOServer } from "../../MYIOServer"   
const TESTPORT = 8924

describe('MYIOServer Connections', () => {
    it('basic launch and stop', async () => {
        const server = new MYIOServer({ port: TESTPORT })
        await server.launch()
        await server.stop()
    })

    it("launching 2 seperate servers should be possible", async () => {
        const server1 = new MYIOServer({ port: TESTPORT })
        await server1.launch()
        await server1.stop()

        const server2 = new MYIOServer({ port: TESTPORT + 1 })
        await server2.launch()
        await server2.stop()
    })

    it("Launching 2 seperate servers on same port should fail", async () => {
        const server1 = new MYIOServer({ port: TESTPORT })
        await server1.launch()

        const server2 = new MYIOServer({ port: TESTPORT })
        await expect(server2.launch()).rejects.toEqual(`port ${TESTPORT} is already in use`)
        await expect(server2.launch()).rejects.toEqual(`port ${TESTPORT} is already in use`)
        await server1.stop()
        await server2.stop()
    })
})

