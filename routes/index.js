  var express = require('express');
  var router = express.Router();
  var CategoryModel = require('../models/category');
  var ProductModel = require('../models/product');
  var CustomerModel = require('../models/customer');
  var ProductModel = require('../models/product');
  var OrderModel = require('../models/order');
  var StatusModel = require('../models/status');
  var ReportModel = require('../models/report');
  var CartModel = require('../models/cart');

  const fs = require("fs");
  const path = require("path");
  const PayOs = require('@payos/node');
  const moment = require('moment-timezone');

const Product = require('../models/product');
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
  router.get("/search", async (req, res) => {
    try {
        let searchKey = req.query.key;
        
        let searchResults = await Product.find({
            name: { $regex: searchKey, $options: 'i' } 
        });

        res.render("site/search", {
            layout: 'layout',
            searchResults, // Pass search results to the template
            searchKey      // Pass the search key back for display
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error occurred while searching');
    }
  });
  // ACCOUNT
  router.get('/account', async (req, res) => {

    const customerEmail = req.session.email; // Get email from session
      // Fetch customer ID based on email
    const customer = await CustomerModel.findOne({ email: customerEmail }).lean();
    if (!customer) {
      // Handle the case where no customer is found (e.g., redirect to login)
      return res.redirect('/auth'); 
    }
    const customerId = customer.id;
    // Find orders associated with the customer
    const orders = await OrderModel.find({ buyerId: customerId }).lean();

    const statusIds = orders.map(order => order.statusId);
    const status = await StatusModel.find({ id: { $in: statusIds } }).lean();
    const statusMap = status.reduce((acc, status) => {
      acc[status.id] = status;
      return acc;
    }, {});
    console.log(status)
    const data = orders.map(order => ({
      ...order,
      status: statusMap[order.statusId] || null
    }));
    res.render('site/account', {
      layout: 'layout',
      data, // Send the array of orders to the view,
      customer: customer
    });
  })
  router.post('/update-profile/:id', async (req, res)=>{
    
    const customerId = req.params.id
    const name = req.body.name
    const email = req.body.email
    const password = req.body.password
    const address = req.body.address
    const phone_number = req.body.phone_number

    const customerData = {
      name: name,
      email: email,
      password: password,
      address: address,
      phone_number: phone_number
    }
    await CustomerModel.findByIdAndUpdate(customerId, customerData).lean()

    res.redirect('/account')
  })
  router.post('/update-status/:id', async (req, res) => {
    const orderId = req.params.id
    await OrderModel.findByIdAndUpdate(orderId, { statusId: 5 }, { new: true, lean: true });
    
    res.redirect('/account')
  })
  router.post('/send-report/:id', async (req, res) => {
    try {
      const title = req.body.title;
      const message = req.body.message;
      const orderId = req.params.id;
      // Find the order using the orderCode
      const order = await OrderModel.findById(orderId).lean();
      if (!order) {
        return res.status(404).send('Order not found');
      }
      // Prepare report data
      const reportData = {
        id: await ReportModel.countDocuments() + 1,
        orderId: order.orderCode,  // Assuming orderId refers to the ObjectId of the order document
        title: title,
        message: message
      };

      // Create and save the new report
      const newReport = new ReportModel(reportData);
      await newReport.save();

      await OrderModel.findByIdAndUpdate(orderId, { statusId: 7 });
      // Redirect with a success message
      res.redirect('/account');
    } catch (error) {
      console.error('Error sending report:', error);
      res.status(500).send('Internal Server Error');
    }
  });
    // CHECKOUT
    function generateOrderCode() {
      return Math.floor(Math.random() * 99999); // Generate a random 6-digit number
    }
  
    router.get('/checkout/success', async (req, res) => {
      const pendingOrder = req.session.pendingOrder;
      console.log("pending order code : " + pendingOrder)
      if (pendingOrder) { // Check if pendingOrder exists
              // Update order status
              pendingOrder.statusId = 2;
  
              // Save the order to the database
              const newOrder = new OrderModel(pendingOrder);
              await newOrder.save();
      } else {
        // Optionally redirect to a different page or handle the situation gracefully
        return res.redirect('/account'); // Redirect to an error page, for example
      }
  
      // Clear the session data
      delete req.session.pendingOrder;
      delete req.session.items
      // Redirect to a success page
      res.redirect('/checkout/success');
    });
  
    router.get('/checkout/cancel' , async (req,res) => {
  
      res.render('checkout/cancel',{
        layout: "/layout"
      })
    });
  
    router.get('/checkout', async(req,res)=>{
      const cart = new CartModel(req.session.cart);
      const customer = await CustomerModel.findOne({email: req.session.email}).lean()
      res.render('checkout',{
        layout: 'layout',
        customer: customer,
        totalPrice: cart.totalPrice,
        totalQty: cart.totalQty,
      })
    });
  
    router.post('/checkout',async (req, res) => {
      const customerEmail = req.session.email;
  
      const customer = await CustomerModel.findOne({ email: customerEmail }).lean();
      
        if (!customer) {
          // Handle the case where no customer is found with the email (e.g., redirect to login)
          return res.redirect('/login'); // Or other error handling
        }
      const customerId = customer.id; 
  
      const cart = new CartModel(req.session.cart)
      const name = req.body.name
      const country = req.body.country
      const address = req.body.address
      const phone = req.body.phone
      const email = req.body.email
      const note = req.body.note
      const paymentMethod = req.body.paymentMethod
      const orderDate = moment().tz('DD.MM.YYYY HH:mm','Asia/Ho_Chi_Minh').format('MMMM Do YYYY, hh:mm a'); 
      const orderData = {
        orderCode: generateOrderCode(),
        buyerId: customerId,
        buyerName: name,
        buyerEmail: email,
        buyerPhone: phone,
        buyerCountry: country,
        buyerAddress: address,
        buyerNote: note,
        amount: cart.totalPrice,
        paymentMethod: paymentMethod,
        items: cart.items,
        statusId: 1,
        note: "",
        orderDate: orderDate
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
      console.log("Pending order: " + req.session.pendingOrder)
      res.redirect(303, paymentLink.checkoutUrl);
      } else if (paymentMethod === 'cod') {
        const newOrder = new OrderModel(orderData);
        await newOrder.save();
        res.redirect('/account')
      } else {
        res.render('checkout',{
          layout: 'layout',
          message: "Choose one method first"
        })
      }
    });
    const payos = new PayOs(
      "c57285fa-6aab-486d-9c15-503c13f158a8",
      "364eea32-f6bc-4b81-884b-66c3eb436424",
      "326f33d24c9beb21bcc00ed032a77118820849f0a64bf694762d12ca017a7dc4"
    );
    // Local
    const DOMAIN_URL='http://localhost:3000'
  module.exports = router;