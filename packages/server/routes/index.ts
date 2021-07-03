import express from 'express';

export const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    // redirect to react dev server
    res.redirect('http://localhost:3000/');
});
