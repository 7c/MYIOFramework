"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const MYIOServer_1 = require("../MYIOServer");
const chalk_1 = __importDefault(require("chalk"));
class CustomMYIOServer extends MYIOServer_1.MYIOServer {
    async onConnection(that, client) {
        super.onConnection(that, client);
        client.on("privateecho", (str, cb) => {
            console.log("privateecho", str, cb);
            cb(null, str);
        });
        client.on("publicecho", (str, cb) => cb(null, str));
        client.on("disconnect", () => {
            console.log("client disconnected");
        });
    }
}
const server_config = {
    scheme: 'http', // default
    ip: '127.0.0.1', // default
    namespace: '/demo',
    output: true, // default
    outputTimestamp: true, // default
    name: 'demo-server',
    port: 13000,
    // if auth is defined, then all the events will be authenticated expect the ones defined in public array
    auth: {
        public: ['publicecho'],
        bytoken: {
            'cbf4175f-40ce-4dce-b9b8-9b44f3119107': {
                name: 'administrator 1',
                permissions: ['privateecho']
            }
        }
    },
    // if auth is not defined, then all events are public! 
};
const server_opts = {
// path:'/socket.io',
};
const server = new CustomMYIOServer(server_config, server_opts);
async function main() {
    try {
        await server.launch();
        console.log("server launched successfully");
        const client = server.IOClient({ name: 'demo-client' }, { auth: { token: 'cbf4175f-40ce-4dce-b9b8-9b44f3119107' } });
        await client.connect(2);
        console.log("client connected successfully");
        const resultPrivateEcho = await client.emitTimeout(2, 'privateecho', 'hello');
        console.log("result of private echo:", resultPrivateEcho);
        const resultPublicEcho = await client.emitTimeout(2, 'publicecho', 'hello');
        console.log("result of public echo:", resultPublicEcho);
        client.disconnect();
        console.log("client disconnected");
        await server.stop();
        console.log("server stopped successfully");
        process.exit(0);
    }
    catch (error) {
        console.error(chalk_1.default.redBright("error:"), error);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=basic.js.map