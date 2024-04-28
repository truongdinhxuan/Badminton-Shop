// const Passport = require('passport');
var express = require("express");
var router = express.Router();
//Models
const OrderModel = require('../models/order');
const ProductModel = require('../models/product');
const CustomerModel = require('../models/customer');
// const OrderStatus = require('../constants/order-status');

router.get('/', async (req, res) => {
    const order = await OrderModel.find().count();
    const product = await ProductModel.find().count();

    
    res.render("admin/index", {
    order: order,
    product: product
    });
});

module.exports = router;