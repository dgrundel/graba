import * as path from 'path';
import express from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';
import { router as indexRouter } from './routes/index';
import { router as streamRouter } from './routes/stream';
import { getConfig } from './models/config';
import { addFeed } from './feeds/feeds';

const app = express();
const PORT = 4000;

// set up feeds
const config = getConfig();
config.feeds.forEach(feed => {
    addFeed(feed.name, feed.streamUrl);
});

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/stream', streamRouter);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});