import * as path from 'path';
import express from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';
import { router as indexRouter } from './routes/index';
import { router as feedRouter } from './routes/feed';
import { start as startFeeds } from './background/feeds';

/**
 * Start background process(es)
 */
startFeeds();

/**
 * Set up express
 */
const app = express();
const PORT = 4000;

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/feed', feedRouter);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});