var express = require('express');
  var router = express.Router();
  var ProductModel = require('../models/product');
  var CustomerModel = require('../models/customer');
  var ProductModel = require('../models/product');
  var OrderModel = require('../models/order');
  var CartModel = require('../models/cart');

  const fs = require("fs");
  const path = require("path");
  const PayOs = require('@payos/node');
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

router.get('/', async (req, res) => {
    const user = await CustomerModel.findOne({email: req.session.email}).lean();
    if (!req.session.cart || Object.keys(req.session.cart.items).length === 0) { 
      return res.render('site/cart', { 
          layout: 'layout',
          products: null, 
          totalPrice: 0,
          totalQty: 0,
          customer: user ? user.name : null // Handle case where user might not be logged in
      });
    }
    const cart = new CartModel(req.session.cart);
    // Get product data with image URLs
    const productsWithImages = await Promise.all(cart.generateArray().map(async (item) => {
      const product = await ProductModel.findById(item.item._id).lean(); // Assuming you need product data from the database
      const imagesDirectory = path.join(__dirname, product.photo);
      const imageFiles = getImageFiles(imagesDirectory);
      const imagesWithUrls = imageFiles.map((file) => `/uploads/${product._id}/${file}`);
      
      return {
        ...item,
        item: {
          ...item.item,
          images: imagesWithUrls
        }
      };
    }));
    res.render('site/cart', {
      layout: 'layout',
      totalPrice: cart.totalPrice,
      totalQty: cart.totalQty,
      customer: user.name,
      products: productsWithImages,
    });
  });

  router.get('/add-cart/:id', async (req, res) => {
    try {
      const productId = req.params.id;
      const cart = new CartModel(req.session.cart ? req.session.cart : {});
      const product = await ProductModel.findById(productId);
      if (!product) {
        return res.redirect('/');
      }

      cart.add(product, product.id);
      req.session.cart = cart;
      console.log(req.session.cart);
      res.redirect('/product');
    } catch (error) {
      console.error(error);
      res.redirect('/');
    }
  });

  router.get('/cart/reduce/:id', async (req, res) =>{
    const productId = req.params.id;
    const product = await ProductModel.findById(productId);
    const cart = new CartModel(req.session.cart ? req.session.cart : {});
    cart.reduceByOne(product.id);
    req.session.cart = cart;
    res.redirect('/cart');
  });

  router.get('/cart/plus/:id', async (req, res) =>{
    const productId = req.params.id;
    const product = await ProductModel.findById(productId);
    const cart = new CartModel(req.session.cart ? req.session.cart : {});
    cart.plusByOne(product.id);
    req.session.cart = cart;
    res.redirect('/cart');
  });

  router.get('/cart/remove/:id', async (req, res) =>{
    const productId = req.params.id;
    const product = await ProductModel.findById(productId);
    const cart = new CartModel(req.session.cart ? req.session.cart : {});
    cart.removeItem(product.id);
    req.session.cart = cart;
    res.redirect('/cart');
  });


  // Server
  // const DOMAIN_URL='https://shopbadmintonvn.onrender.com'
  module.exports = router;