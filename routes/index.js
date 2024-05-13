var express = require('express');
var router = express.Router();
var CategoryModel = require('../models/category');
var ProductModel = require('../models/product');
var CustomerModel = require('../models/customer');
var ProductModel = require('../models/product');
var BrandModel = require('../models/brand');
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
        const imagesWithUrls = imageFiles.map((file) => `/uploads/product/${product._id}/${file}`);
  
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
        const imagesWithUrls = imageFiles.map((file) => `/uploads/product/${product._id}/${file}`);
  
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
// ACCOUNT
router.get('/account', async (req, res) => {
  const user = await CustomerModel.findOne({email: req.session.email}).lean();
  res.render('site/account', {
    layout: 'layout',
    customer: user.name
  })
})
// PRODUCT
router.get('/product',async(req,res) =>{
  try {
    // Fetch all products
    const products = await ProductModel.find().lean();
    
    const category = await CategoryModel.find().lean();
    
    const brand = await BrandModel.find().lean();

    const user = await CustomerModel.findOne({email: req.session.email}).lean();

  

    const productBigData = await Promise.all(products.map(async (product) => {
      
      const imagesDirectory = path.join(__dirname, product.photo);
      const imageFiles = getImageFiles(imagesDirectory);
      const imagesWithUrls = imageFiles.map((file) => `/uploads/product/${product._id}/${file}`);

      return {
        ...product,
        images: imagesWithUrls,
      };
    }));
      
    res.render('site/product', {
      layout: "/layout",
      category: category,
      product: productBigData,
      customer: user,
    }); 
  } catch (error) { 
    console.error('Error fetching products:', error);
    res.status(500).send('Internal Server Error');
  }
})
// CART
router.get('/cart', async (req, res) => {
  const user = await CustomerModel.findOne({email: req.session.email}).lean();
  if (!req.session.cart) {
    return res.render('site/cart', { products: null });
  }
  const cart = new CartModel(req.session.cart);
  // Get product data with image URLs
  const productsWithImages = await Promise.all(cart.generateArray().map(async (item) => {
    const product = await ProductModel.findById(item.item._id).lean(); // Assuming you need product data from the database
    const imagesDirectory = path.join(__dirname, product.photo);
    const imageFiles = getImageFiles(imagesDirectory);
    const imagesWithUrls = imageFiles.map((file) => `/uploads/product/${product._id}/${file}`);
    
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

// Checkout
const payos = new PayOs(
  "c57285fa-6aab-486d-9c15-503c13f158a8",
  "364eea32-f6bc-4b81-884b-66c3eb436424",
  "326f33d24c9beb21bcc00ed032a77118820849f0a64bf694762d12ca017a7dc4"
);
router.get('/checkout/success', async (req, res) => {
  const pendingOrder = req.session.pendingOrder;

  if (pendingOrder) { // Check if pendingOrder exists
      try {
          // Update order status
          pendingOrder.status = "Đã chuyển khoản";

          // Save the order to the database
          const newOrder = new OrderModel(pendingOrder);
          await newOrder.save();
      } catch (error) {
          console.error('Error saving order:', error);
          return res.status(500).send('An error occurred processing your order.'); 
          // Return to prevent further execution in case of error
      }
  } else {
      console.warn('Pending order not found in session.');
      // Optionally redirect to a different page or handle the situation gracefully
      return res.redirect('/checkout/error'); // Redirect to an error page, for example
  }

  // Clear the session data
  delete req.session.pendingOrder;

  // Redirect to a success page
  res.redirect('/checkout/success');
});

router.get('/checkout/cancel' , async (req,res) => {

  res.render('checkout/cancel')
})
router.get('/checkout', async(req,res)=>{
  const cart = new CartModel(req.session.cart);
  const customer = await CustomerModel.findOne({email: req.session.email}).lean()
  res.render('site/checkout',{
    layout: 'layout',
    customer: customer.name,
    totalPrice: cart.totalPrice,
    totalQty: cart.totalQty,
  })
});
function generateOrderCode() {
  return Math.floor(Math.random() * 99999); // Generate a random 6-digit number
}
// Local
const DOMAIN_URL='http://localhost:3000'
// Server
// const DOMAIN_URL='https://shopbadmintonvn.onrender.com'

router.post('/checkout',async (req, res) => {
  const cart = new CartModel(req.session.cart)
  const name = req.body.name
  const country = req.body.country
  const address = req.body.address
  const phone = req.body.phone
  const email = req.body.email
  const note = req.body.note
  const paymentMethod = req.body.paymentMethod
  
  const orderData = {
    orderCode: generateOrderCode(),
    buyerName: name,
    buyerEmail: email,
    buyerPhone: phone,
    buyerCountry: country,
    buyerAddress: address,
    buyerNote: note,
    amount: cart.totalPrice,
    paymentMethod: paymentMethod,
    items: cart.items,
    status: "Chờ xác nhận"
  }

  if (paymentMethod === 'bank') {
  const order = {
      orderCode: orderData.orderCode,
      amount: cart.totalPrice,
      description: "ShopBadmintonVn",
      returnUrl: `${DOMAIN_URL}/checkout/success`,
      cancelUrl: `${DOMAIN_URL}/checkout/cancel`,
      
  }
  const paymentLink = await payos.createPaymentLink(order);
  req.session.pendingOrder = orderData;
  console.log(req.session.pendingOrder)
  res.redirect(303, paymentLink.checkoutUrl);
  } else if (paymentMethod === 'cod') {
    const newOrder = new OrderModel(orderData);
    await newOrder.save();
    res.redirect('/checkout/success')
  } else {
    res.render('site/checkout',{
      layout: 'layout',
      message: "Choose one method first"
    })
  }
});
module.exports = router;
