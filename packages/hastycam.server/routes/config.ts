import express from 'express';
import conf from 'conf';

export const router = express.Router();

const config = new conf({
    configName: 'appConfig',
});

console.log('config.path: ', config.path);

router.get('/:key', function(req, res, next) {
    const key = req.params.key;
    const value = config.get(key);

    console.log('config.get', key, value);

    res.type('text/plain').send(value);
});

router.post('/:key', function(req, res, next) {
    const key = req.params.key;
    const value = req.body;

    console.log('config.post', key, value);

    config.set(key, value);
    res.send('OK');
});

router.delete('/:key', function(req, res, next) {
    const key = req.params.key;

    console.log('config.delete', key);

    config.delete(key);
    res.send('OK');
});
