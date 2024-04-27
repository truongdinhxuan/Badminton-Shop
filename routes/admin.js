var express = require("express");
var router = express.Router();
//Models
const OrderModel = require('../models/order');
const ProductModel = require('../models/product');
const UserModel = require('../models/user');
// const OrderStatus = require('../constants/order-status');
const Passport = require('../modules/passport');

router.get('/', Passport.requireAuth, async (req, res) => {
    const order = await OrderModel.find().count();
    const product = await OrderModel.find().count();
    const user = await OrderModel.find().count();
    
    res.render("admin/index", {
    order: order,
    product: product,
    user: user
    });
});

module.exports = router;