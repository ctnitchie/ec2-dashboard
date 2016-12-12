import index from './routes/index';
import users from './routes/users';
import {initServiceRoutes} from './services';

export default function setupRoutes(app) {
  app.use('/', index);
  app.use('/users', users);

  initServiceRoutes(app);
}
