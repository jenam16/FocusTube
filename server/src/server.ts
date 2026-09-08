import app from './app.js';
import { config } from './config/index.js';
import { connectDB } from './config/db.js';

const PORT = config.port;

const startServer = async () => {
  connectDB();

  app.listen(PORT, () => {
    console.log(`FocusTube server listening on port ${PORT}`);
  });
};

startServer();
