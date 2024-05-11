var express = require('express');
var router = express.Router();
var CategoryModel = require('../models/category');
var ProductModel = require('../models/product');
var CustomerModel = require('../models/customer')
const fs = require("fs");
const path = require("path");
// const { checkLoginSession } = require("../middlewares/auth");
/* GET home page. */
// router.get('/', async (req, res, next) {
//   res.render('index', { title: 'Hello World' });
// });
const imagesExtensions = /.(png|jpg|jpeg)$/i;
const getImageFiles = (directory) => {
  try {
    return fs
      .readdirSync(directory)
      .filter((file) => imagesExtensions.test(file));
  } catch (error) {
    console.error(error.message);
    return [];
  }
};
router.get("/", async (req, res) => {
  try {
    // Fetch all products
    const products = await ProductModel.find().lean();
    
    const category = await CategoryModel.find().lean();
    
    const user = await CustomerModel.findOne({email: req.session.email}).lean();
    
    if (!user) {
      const productBigData = await Promise.all(products.map(async (product) => {
      
        const imagesDirectory = path.join(__dirname, product.photo);
        const imageFiles = getImageFiles(imagesDirectory);
        const imagesWithUrls = imageFiles.map((file) => `/uploads/${product._id}/${file}`);
  
        return {
          ...product,
          images: imagesWithUrls,
        };
      }));
        
      res.render('index', {
        layout: "/layout",
        category: category,
        product: productBigData,
      });
    } else {
      const productBigData = await Promise.all(products.map(async (product) => {
      
        const imagesDirectory = path.join(__dirname, product.photo);
        const imageFiles = getImageFiles(imagesDirectory);
        const imagesWithUrls = imageFiles.map((file) => `/uploads/${product._id}/${file}`);
  
        return {
          ...product,
          images: imagesWithUrls,
        };
      }));
        
      res.render('index', {
        layout: "/layout",
        category: category,
        product: productBigData,
        customer: user.name
      });
    }
    
  } catch (error) { 
    console.error('Error fetching products:', error);
    res.status(500).send('Internal Server Error');
  }
})
router.get('/account', async (req, res) => {
  const user = await CustomerModel.findOne({email: req.session.email}).lean();
  res.render('site/account', {
    layout: 'layout',
    customer: user.name
  })
})
module.exports = router;
