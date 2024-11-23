var express = require("express");
var router = express.Router();

const PayOs = require('@payos/node');
var CartModel = require('../models/cart');
var CustomerModel = require('../models/customer');
const moment = require('moment-timezone');
var OrderModel = require('../models/order');

function generateOrderCode() {
    return Math.floor(Math.random() * 99999); // Generate a random 6-digit number
}
function generateOrderId() {
  return 
}

router.get('/success', async (req, res) => {
    const pendingOrder = req.session.pendingOrder;
    console.log("pending order code : " + pendingOrder)
    if (pendingOrder) { // Check if pendingOrder exists
            // Update order status
            pendingOrder.statusId = 2;

            // Save the order to the database
            const newOrder = new OrderModel(pendingOrder);
            req.session.cart = { items: {}, totalQty: 0, totalPrice: 0 }; 
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

router.get('/cancel' , async (req,res) => {

    res.render('checkout/cancel',{
      layout: "/layout"
    })
  });

  router.get('/', async(req,res)=>{
    const cart = new CartModel(req.session.cart);
    const customer = await CustomerModel.findOne({email: req.session.email}).lean()
    res.render('checkout',{
      layout: 'layout',
      customer: customer,
      totalPrice: cart.totalPrice,
      totalQty: cart.totalQty,
    })
  });

  router.post('/',async (req, res) => {
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
    const orderDate = moment().tz('DD.MM.YYYY HH:mm','Asia/Ho_Chi_Minh').format('MMMM Do YYYY, hh:mm a'),
    isDelete = false

    const orderCount = await OrderModel.countDocuments({ buyerId: customerId });
    const orderId = orderCount + 1; // Tạo orderId mới dựa trên số lượng đơn hàng hiện tại

    const orderData = {
      orderId: orderId,
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
      orderDate: orderDate,
      isDelete: isDelete
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
      //remote cart session
      req.session.cart = { items: {}, totalQty: 0, totalPrice: 0 };
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
  const DOMAIN_URL='http://localhost:3000'
module.exports = router; 