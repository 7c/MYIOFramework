import { Socket } from 'socket.io';

declare module 'socket.io' {
    interface Socket {
        admin?: any;
        ip?: string;
        browser?: string;
        
    }
}