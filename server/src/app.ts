import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './routes/index.js';
import { errorHandler } from './middleware/index.js';
import { config } from './config/index.js';

const app: Application = express();

app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api', routes);

app.use(errorHandler);

export default app;
