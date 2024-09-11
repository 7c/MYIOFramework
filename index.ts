import { Socket } from 'socket.io';
import { MYIOServer } from './MYIOServer';
import { MYIOClient } from './MYIOClient';


export { MYIOServer, MYIOClient }

declare module 'socket.io' {
    interface Socket {
        admin?: any;
        ip?: string;
        browser?: string;
        
    }
}