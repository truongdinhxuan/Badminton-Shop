var express = require('express');
var router = express.Router();
var CustomerModel = require('../models/customer')

const { checkLoginSession } = require("../middlewares/auth");
const Customer = require('../models/customer');
/* GET home page. */
// router.get('/', async (req, res, next) {
//   res.render('index', { title: 'Hello World' });
// });

router.get("/", checkLoginSession, async function (req, res, next) {
  const user = await  CustomerModel.findOne({ email: req.session.email }).lean();
  res.render('index' , {
    customer: user.name 
  })
})
module.exports = router;
