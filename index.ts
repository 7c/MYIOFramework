import { Socket } from 'socket.io';
import { MYIOServer } from './MYIOServer.js';

const { MYIOClient } = require('./MYIOClient.js');

export { MYIOServer, MYIOClient }

declare module 'socket.io' {
    interface Socket {
        admin?: any;
        ip?: string;
        browser?: string;
        
    }
}