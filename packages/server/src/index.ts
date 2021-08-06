import * as path from 'path';
import express from 'express';
import cookieParser from 'cookie-parser';
import { text, json } from 'body-parser';
import morgan from 'morgan';
import cors from 'cors';
import { logger } from './helpers/logger';
import { start as startFeeds } from './background/streams';
import { router as indexRouter } from './routes/index';
import { router as dashboardRouter } from './routes/dashboard';
import { router as configRouter } from './routes/config';
import { router as feedRouter } from './routes/feed';
import { router as playbackRouter } from './routes/playback';

/**
 * Start background process(es)
 */
startFeeds();

/**
 * Set up express
 */
const app = express();
const PORT = 4000;

app.use(morgan('combined', { 
    stream: { 
        write: message => logger.http(message.trim())
    }
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(text()); // body-parser
app.use(json()); // body-parser
app.use(express.static(path.join(__dirname, 'public')));

// controllers
app.use('/', indexRouter);
app.use('/dashboard', dashboardRouter);
app.use('/config', configRouter);
app.use('/feed', feedRouter);
app.use('/playback', playbackRouter);

// error logger
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error(err);
    next(err);
});


app.listen(PORT, () => {
    logger.http(`Server is running at http://localhost:${PORT}`);
});
