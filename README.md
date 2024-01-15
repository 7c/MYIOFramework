## myIOFramework
consists of server and client which is wrapper around existing socket.io library. It is designed to be used in node.js and browser (future plan)..
```
npm i --save https://github.com/7c/myioframework
```

## MYIOServer
```javascript
const { MYIOServer } = require('MYIOFramework');

class CustomMYIOServer extends MYIOServer {
    onConnection(that, client) {
        super.onConnection(that, client)
        client.on("publicecho",(str,cb) => cb(null,str))
        client.on("privateecho",(str,cb) => cb(null,str))
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

## MYIOClient
```javascript

const client_config = {
    // specify server to connect to 
    // scheme: 'http',
    // ip:'127.0.0.1',
    // port: 3000,
    // namespace: '/sec',
    // or
    
    url:'http://127.0.0.1:3000/sec',
}

const client_opts = {
    auth: {token:'f831695e-1f42-4ba5-b86a-6c4284f2b34f'},
    // path:'/socket.io', 
}

const { MYIOClient } = require('MYIOFramework')
let client1 = new MYIOClient(client_config,client_opts)
await client1.connect(2)
await client1.whoami(2)
await client1.emit('publicecho', {data:'hello'})
await client1.emit('privateecho', {data:'hello'})
await client1.emitTimeout(5,'publicecho', {data:'hello'})
client1.disconnect()
```
