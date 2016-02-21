var express = require('express');
var router = express.Router();
var auth=require('../controllers/auth');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.status(200);
    res.json({});
});

router.post('/register', auth.register);
router.post('/login', auth.login);

module.exports = router;
