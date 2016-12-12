import * as rpc from 'lwrpc/server';
import Router from 'express';
import ec2service from './ec2service';

const serviceManager = new rpc.ServiceManager();
serviceManager.registerService('aws', ec2service);

function initServiceRoutes(app) {
  app.use('/rpc', rpc.expressBinding(Router(), {serviceManager}));
}

function initServiceSockets(io) {
  rpc.socketioBinding(io, {serviceManager});
  ec2service.on('instanceStateChanged', data => io.emit('instanceStateChanged', data));
}

serviceManager.on('methodFailed', (req, resp, e) => {
  console.log('METHOD ERROR');
  console.log(JSON.stringify(req, null, 2));
  console.log(JSON.stringify(resp, null, 2));
  console.log(e);
});

export default serviceManager;
export {initServiceRoutes, initServiceSockets, serviceManager};
