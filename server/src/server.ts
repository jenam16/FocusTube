import http from 'http';
import app from './app.js';
import { config } from './config/index.js';
import { connectDB } from './config/db.js';
import { initSocketServer } from './services/socketService.js';

const PORT = config.port;

const startServer = async () => {
  connectDB();

  const httpServer = http.createServer(app);
  initSocketServer(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`FocusTube server listening on port ${PORT}`);
  });
};

startServer();
