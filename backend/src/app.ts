import express, { type Express } from 'express';
import cors from 'cors';
import morgan from 'morgan';

import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

export function createApp(): Express {
    const app = express();

    app.use(cors());
    app.use(express.json({ limit: '1mb' }));
    app.use(morgan('dev'));

    app.use('/api', routes);

    app.use(notFound);
    app.use(errorHandler);

    return app;
}

export default createApp;