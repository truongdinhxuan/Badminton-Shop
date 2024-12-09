var express = require("express");
var router = express.Router();
const { checkLoginSession } = require("../middlewares/auth");
const StaffModel = require('../models/staff')
const OrderModel = require('../models/order')
const ProductModel = require('../models/product')

router.get('/',checkLoginSession, async (req, res) => {
    // Dashboard.... Chinh sau
    const order = await OrderModel.find().count();
    const product = await ProductModel.find().count();
    const user = await  StaffModel.findOne({ email: req.session.email }).lean();
    
    res.render("staff", {
    layout: "staff/layout",
    staff: user.name,
    order: order,
    product: product
    });
});
router.get('/order',async (req,res) => {
    
})

module.exports = router;