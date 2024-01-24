import { io,Socket } from 'socket.io-client';
import { SERVER_ROOT } from './constants';
import { eventNames } from 'process';

/*
const URL = process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:4000';
export const socket = io(URL);
*/

const ClientNamespaces = [ "MembraneBuilder", "Martinize", "PolymerEditor", "History"] as const;
type  ClientNamespaces = typeof ClientNamespaces[number];
const isClientNamepaces = (value: string): value is ClientNamespaces => {
    return ClientNamespaces.includes(value as any);
};




/**
 * 
 * @param namespace a valid SocketController declared on back-end side
 * @returns The namespace-scoped socket.io Socket object
 */
export const getSocket = (namespace:string):Socket => {
    //console.log("==>" + SERVER_ROOT);
    if(!isClientNamepaces(namespace))
        throw(`[Socket:getSocket] unknown namespace ${namespace}\"`);

    //const endPoint=`${SERVER_ROOT}/${namespace}` 
    console.log(`TRYING @${namespace}`);    
    const socketClient = io(`/${namespace}`);
    
    socketClient.on( "connect", ()=> console.log(`CONNECTED @${namespace}`) );
    return socketClient;
};

export { Socket };


/**
 * A socket.io-client Socket wrapper to unwrap incoming error messages NOT TRIED YET
 */

export class MAD_ClientSocket {
    
    constructor(private socket:Socket) {}
    
    on(evt:string, callback:Function) {
        this.socket.on(evt, (data?:any) => {
            if(typeof data === "object") 
                if(data?.type === "error")
                    throw( new SocketErrorMessage(data?.content))
            callback(data);
        });
    }

    emit(evt:string, data?:any) {
        this.socket.emit(evt, data);
    }
    /* expecting answer on the same message name use to emit*/
    async request(evt:string, data?:any) {
        this.socket.off(evt);
        this.socket.emit(evt, data);

        return new Promise( (res, rej) => {
            this.on(evt, (dataAns?:any) => { // to benfits from error unwrap
                res(dataAns);
            });
        });
    }
}



export const getNiceSocket = (namespace:string):MAD_ClientSocket => {
    if(!isClientNamepaces(namespace))
        throw(`[Socket:getSocket] unknown namespace ${namespace}\"`);

    const endPoint=`${SERVER_ROOT.replace(/\/$/, '')}/${namespace}` 
    console.log(`TRYING @${endPoint}`);    
    const socketClient = io(endPoint);
    
    socketClient.on( "connect", ()=> console.log(`CONNECTED @${endPoint}`) );
    return new MAD_ClientSocket(socketClient);
};


export class SocketErrorMessage extends Error{}