## myIOFramework - Typescript generation
- commonjs version is 0.* (previous commits)
- typescript version is 1.* (not stable yet)

consists of server and client which is wrapper around existing socket.io library. It is designed to be used in NodeJs and browser (future plan).. You can refer to [basic.ts example](./examples/basic.ts) to get started.
```
npm i --save https://github.com/7c/myioframework
```

## MYIOServer Quick Start
```typescript
import { MYIOServer } from '@7c/myioframework';
import { Socket } from 'socket.io';

class CustomMYIOServer extends MYIOServer {
    async onConnection(that:MYIOServer, client:Socket) {
        super.onConnection(that, client)
        client.on("privateecho", (str:string, cb:Function) =>  cb(null, str))
        client.on("publicecho", (str:string, cb:Function) => cb(null, str))
    }
}
const server_config = {
    // scheme: 'http',
    // ip:'127.0.0.1',
    // port: 3000,
    namespace: '/sec',
    // output: true,

    // if auth is defined, then all the events will be authenticated expect the ones defined in public array
    auth: {
        public: ['publicecho'],
        bytoken: {
            "f831695e-1f42-4ba5-b86a-6c4284f2b34f": {
                name: 'administrator 1',
                permissions: ['privateecho']
            }
        }
    },
    // if auth is not defined, then all events are public! 
}

const server_opts = {
    // path:'/socket.io',
}

const server = new CustomMYIOServer(server_config,server_opts)

await server.launch()
await server.stop()
```

## MYIOClient Quick Start
```typescript
import { MYIOClient,IOClientConfig, IOClientOptions } from '@7c/myioframework';


let client_config : IOClientConfig = {
    // specify server to connect to 
    // scheme: 'http',
    // ip:'127.0.0.1',
    // port: 3000,
    // namespace: '/sec',
    // or
    
    url:'http://127.0.0.1:3000/sec',
}

let client_opts : IOClientOptions = {
    auth: { token:'f831695e-1f42-4ba5-b86a-6c4284f2b34f' },
    // path:'/socket.io', 
}

let client1 = new MYIOClient(client_config,client_opts)
await client1.connect(2)
await client1.whoami(2)
await client1.emit('publicecho', {data:'hello'})
await client1.emit('privateecho', {data:'hello'})
await client1.emitTimeout(5,'publicecho', {data:'hello'})
client1.disconnect()
```
