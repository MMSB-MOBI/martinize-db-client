import { io } from 'socket.io-client';
import { SERVER_ROOT } from './constants';

/*
const URL = process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:4000';
export const socket = io(URL);
*/

const socketClient = io(SERVER_ROOT);
console.log("TRYINT @");
console.dir(SERVER_ROOT);
socketClient.on("connect", ()=>{console.log("KIKOOUUU")});

export default socketClient;