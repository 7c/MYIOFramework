import { MYIOServer } from "../../MYIOServer"

describe('MYIOServer constructor', () => {
    test('uses default configuration when properties are missing', async () => {
        const server = new MYIOServer({});

        expect(server.config.port).toBe(7555);
        expect(server.config.ip).toBe('127.0.0.1');
        expect(server.config.name).toBe('ioserver');
        expect(server.config.output).toBe(false);
        expect(server.config.onClientDisconnect).toBe(undefined);
        expect(server.config.onClientConnect).toBe(undefined);
        expect(server.config.namespace).toBe("/");
        expect(server.config.scheme).toBe('http');
        await server.stop()
    })

    test('throws error when required configuration properties are missing', () => {
        expect(() => new MYIOServer({port:undefined})).toThrow('port must be a number');
        //@ts-ignore
        expect(() => new MYIOServer({ port: 17850,ip:false })).toThrow('ip must be a string');
        //@ts-ignore
        expect(() => new MYIOServer({ port: 17850, ip: '127.0.0.1', name: false })).toThrow('name must be a string');
        expect(() => new MYIOServer({ port: 17850, ip: '127.0.0.1', name: 'test', output:undefined })).toThrow('output must be a boolean');
        //@ts-ignore
        expect(() => new MYIOServer({ port: 17850, ip: '127.0.0.1', name: 'test', output: true, namespace:1 })).toThrow('namespace must be a string');
        expect(() => new MYIOServer({ port: 17850, ip: '127.0.0.1', name: 'test', output: true, namespace: '/test', scheme:undefined })).toThrow('scheme must be a string');
    });

    test('throws error when configuration properties are of incorrect type', () => {
        //@ts-ignore
        expect(() => new MYIOServer({ port: '17850', ip: '127.0.0.1', name: 'test', output: true, namespace: '/test', scheme: 'http' })).toThrow('port must be a number');
        //@ts-ignore
        expect(() => new MYIOServer({ port: 17850, ip: 127, name: 'test', output: true, namespace: '/test', scheme: 'http' })).toThrow('ip must be a string');
        //@ts-ignore
        expect(() => new MYIOServer({ port: 17850, ip: '127.0.0.1', name: 123, output: true, namespace: '/test', scheme: 'http' })).toThrow('name must be a string');
        //@ts-ignore
        expect(() => new MYIOServer({ port: 17850, ip: '127.0.0.1', name: 'test', output: 'true', namespace: '/test', scheme: 'http' })).toThrow('output must be a boolean');
        //@ts-ignore
        expect(() => new MYIOServer({ port: 17850, ip: '127.0.0.1', name: 'test', output: true, namespace: 123, scheme: 'http' })).toThrow('namespace must be a string');
        //@ts-ignore
        expect(() => new MYIOServer({ port: 17850, ip: '127.0.0.1', name: 'test', output: true, namespace: '/test', scheme: 123 })).toThrow('scheme must be a string');
    });

    test('throws error when configuration properties have invalid values', () => {
        expect(() => new MYIOServer({ port: 0, ip: '127.0.0.1', name: 'test', output: true, namespace: '/test', scheme: 'http' })).toThrow('port must be between 1-65535');
        expect(() => new MYIOServer({ port: 17850, ip: 'invalid ip', name: 'test', output: true, namespace: '/test', scheme: 'http' })).toThrow('ip is not valid');
        //@ts-ignore
        expect(() => new MYIOServer({ port: 17850, ip: '127.0.0.1', name: 'test', output: true, namespace: '/test', scheme: 'invalid scheme' })).toThrow('scheme must be http or https');
    });
});