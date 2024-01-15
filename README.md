## myIOFramework
consists of server and client which is wrapper around existing socket.io library. It is designed to be used in node.js and browser (future plan)..

## MYIOServer
```javascript
const { MYIOServer } = require('MYIOFramework');

class CustomIOSERVER extends MYIOServer {
  
    async onConnect(socket) {
        console.log('onConnect')
    }

    async onDisconnect(socket) {
        console.log('onDisconnect')
    }
}
const server_config = {
    scheme: 'http',
    ip:'127.0.0.1',
    port: 3000,
    namespace: '/pub',
    output: true,
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

const server = new MYIOServer(server_config)

await server.launch()
await server.stop()
```

## MYIOClient
```javascript

const client_config = {
    scheme: 'http',
    ip:'127.0.0.1',
    port: 3000,
    namespace: '/pub',
}

const { MYIOClient } = require('MYIOFramework')
let client1 = new MYIOClient(client_config,{auth:{token:'f831695e-1f42-4ba5-b86a-6c4284f2b34f'}})
await client1.connect(2)
await client1.whoami(2)
await client1.emit('publicecho', {data:'hello'})
await client1.emit('privateecho', {data:'hello'})
await client1.emitTimeout(5,'publicecho', {data:'hello'})
client1.disconnect()
```
