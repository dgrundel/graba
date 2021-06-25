import * as path from 'path';
import express from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import { router as indexRouter } from './routes/index';

const app = express();
const PORT = 4000;

// const indexRouter = require('./routes/index');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});