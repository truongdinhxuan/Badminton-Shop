var express = require('express');
var router = express.Router();
var CustomerModel = require('../models/customer')

// const { checkLoginSession } = require("../middlewares/auth");
/* GET home page. */
// router.get('/', async (req, res, next) {
//   res.render('index', { title: 'Hello World' });
// });

router.get("/", async function (req, res, next) {
  
  res.render('index' , {
    
  })
})
module.exports = router;
