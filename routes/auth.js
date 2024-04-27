var express = require("express");
var router = express.Router();

const BcryptJs = require('bcryptjs');
const Passport = require('../modules/passport');
const UserModel = require('../models/user');
const UserRole = require('../constants/user-role');

router.get('/admin/login', (req, res) => {
    const model = {
        callbackUrl: '/admin/login'
    };

    if (req.query.returnUrl && req.query.returnUrl.length > 0) {
        model.callbackUrl = `${model.callbackUrl}?returnUrl=${req.query.returnUrl}`;
    }

    res.render('admin/auth/login', model);
});

router.post('/admin/login', Passport.auth(), (req, res) => {
    let sReturnUrl = undefined;

    if (req.query.returnUrl && req.query.returnUrl.length > 0) {
        sReturnUrl = decodeURI(req.query.returnUrl);
    }

    if (!sReturnUrl) {
        return res.redirect('/admin');
    }
    else {
        return res.redirect(sReturnUrl);
    }
});