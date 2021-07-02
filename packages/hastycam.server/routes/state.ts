import express from 'express';
import conf from 'conf';

export const router = express.Router();

const state = new conf({
    configName: 'appState',
});

console.log('state.path: ', state.path);

router.get('/:key', function(req, res, next) {
    const key = req.params.key;
    const value = state.get(key);

    console.log('state.get', key, value);

    res.type('text/plain').send(value);
});

router.post('/:key', function(req, res, next) {
    const key = req.params.key;
    const value = req.body;

    console.log('state.post', key, value);

    state.set(key, value);
    res.send('OK');
});

router.delete('/:key', function(req, res, next) {
    const key = req.params.key;

    console.log('state.delete', key);

    state.delete(key);
    res.send('OK');
});
