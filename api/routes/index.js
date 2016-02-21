var express = require('express');
var router = express.Router();
var auth=require('../controllers/auth');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.status(200);
    res.json({});
});

router.post('/users/register', auth.register);
router.post('/users/login', auth.login);
router.post('/users/confirm', auth.confirm);

module.exports = router;
