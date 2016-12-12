import io from 'socket.io-client';
import * as rpc from 'lwrpc/client';
import {EventEmitter} from 'events';

export const socket = io();
export const socketClient = rpc.SocketClient(socket);
export const ec2Service = rpc.Proxy(socketClient, 'aws', [
  'listInstances',
  'startInstances',
  'stopInstances',
  'requestNotification'
]);
export const eventBus = new EventEmitter();
eventBus.setMaxListeners(1000);

socket.on('instanceStateChanged', data => {
  eventBus.emit('instanceStateChanged', data);
  eventBus.emit('instanceStateChanged.' + data.id, data);
});
