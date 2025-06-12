let express = require('express');
var middleware = require('../Middleware/middleware');
let router = express.Router();
var AccountController = require('../Controller/Staff/AccountController');

router.post('/get-account',  AccountController.get_account_details);

module.exports = router;