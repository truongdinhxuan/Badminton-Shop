  var express = require('express');
  var router = express.Router();
  var CategoryModel = require('../models/category');
  var ProductModel = require('../models/product');
  var CustomerModel = require('../models/customer');
  var ProductModel = require('../models/product');
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
  // INDEX & AUTH
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
  router.get('/search', async (req, res) => {
    const customerEmail = req.session.email; // Get email from session
  
      // Fetch customer ID based on email
      const customer = await CustomerModel.findOne({ email: customerEmail });
    const searchQuery = req.query.key || '';
    const page = parseInt(req.query.page) || 1;
    const pageSize = 10;
    const category = await CategoryModel.find().lean()
    // Truy vấn tìm kiếm trong cơ sở dữ liệu
    const products = await ProductModel.find({
      name: { $regex: searchQuery, $options: 'i' }
    })
    .skip((page - 1) * pageSize)
    .limit(pageSize).lean();
    const productBigData = await Promise.all(products.map(async (product) => {
        
      const imagesDirectory = path.join(__dirname, product.photo);
      const imageFiles = getImageFiles(imagesDirectory);
      const imagesWithUrls = imageFiles.map((file) => `/uploads/${product._id}/${file}`);

      return {
        ...product,
        images: imagesWithUrls,
      };
    }));
    const totalProducts = await ProductModel.countDocuments({
      name: { $regex: searchQuery, $options: 'i' }
    });
    
    res.render('site/search', {
      products: productBigData,
      searchQuery,
      category,
      totalPages: Math.ceil(totalProducts / pageSize),
      currentPage: page,
      customer
    });
  });
  module.exports = router;