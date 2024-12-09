var express = require("express");
var router = express.Router();
const mongoose = require('mongoose');

var CustomerModel = require('../models/customer');
var OrderModel = require('../models/order');
var StatusModel = require('../models/status');
var ReportModel = require('../models/report')
var CartModel = require('../models/cart')
var ProductModel = require('../models/product')
var BrandModel = require('../models/brand')
var CategoryModel = require('../models/category')

const fs = require("fs");
const path = require('path');
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
// router.get('/', async (req, res) => {

//     const customerEmail = req.session.email; // Get email from session
//       // Fetch customer ID based on email
//     const customer = await CustomerModel.findOne({ email: customerEmail }).lean();
//     if (!customer) {
//       // Handle the case where no customer is found (e.g., redirect to login)
//       return res.redirect('/auth'); 
//     }
//     res.render('account', {
//       layout: 'layout',
//       // data, // Send the array of orders to the view,
//       customer: customer,
//       // bank: bank.bank
//     });
//   })
router.get('/profile', async (req, res) => {
  const customerEmail = req.session.email; // Get email from session
  // Fetch customer ID based on email
  const customer = await CustomerModel.findOne({ email: customerEmail }).lean();
  if (!customer) {
    // Handle the case where no customer is found (e.g., redirect to login)
    return res.redirect('/auth'); 
  }
  // Hiện tại chỉ dùng name để lưu, việc craw khiến việc data thừa load khá lâu
  const bank = {
    "bank": [
      {"name": "Vietcombank"},
      {"name": "Agribank"},
      {"name": "BIDV"},
      {"name": "Vietinbank"},
      {"name": "Techcombank"},
      {"name": "ACB"},
      {"name": "MB"},
      {"name": "Sacombank"},
      {"name": "DongA Bank"},
      {"name": "Eximbank"},
      {"name": "ABBank"},
      {"name": "TPBank"},
      {"name": "VPBank"},
      {"name": "SCB"},
      {"name": "Viet Capital Bank"},
      {"name": "LienVietPostBank"},
      {"name": "MSB"},
      {"name": "Nam A Bank"},
      {"name": "OCB"},
      {"name": "SHB"}
    ]
  }
  res.render('account/profile', {
    layout:'layout',
    customer: customer,
    bank: bank.bank
  })
  })

router.get('/order', async (req, res) => {
    try {
      const customerEmail = req.session.email; // Get email from session
  
      // Fetch customer ID based on email
      const customer = await CustomerModel.findOne({ email: customerEmail }).sort({ orderId: -1 }).lean();
      if (!customer) {
        // Handle the case where no customer is found (e.g., redirect to login)
        return res.redirect('/auth');
      }
  
      const customerId = customer.id;
  
      // Find orders associated with the customer
      const orders = await OrderModel.find({ buyerId: customerId, isDelete: false }).sort({orderDate: -1}).lean();
      // Check if orders exist
      if (!orders || orders.length === 0) { 
        return res.render('account/order', {
          layout: 'layout',
          data: [], // No orders to render
          customer,
        });
      }
  
      // Process items for each order
      const processedOrders = await Promise.all(
        orders.map(async (order) => {
          const items = order.items || {}; // Ensure `items` is an object
          const processedItems = await Promise.all(
            Object.values(items).map(async (itemObj) => {
              const item = itemObj.item;
              console.log(item)
              // Skip if `item` is not defined
              if (!item) {
                return null;
              }
              // Process images
              const imagesDirectory = path.join(__dirname, '..', 'public', 'uploads', item._id.toString());
              let imagesWithUrls = [];
              try {
                const imageFiles = getImageFiles(imagesDirectory); // Make sure this function is defined
                imagesWithUrls = imageFiles.map((file) => `/uploads/${item._id}/${file}`);
              } catch (error) {
                console.error(`Error fetching images for item ${item._id}:`, error.message);
              }
  
              return {
                ...itemObj,
                item: {
                  ...item,
                  image: imagesWithUrls,
                },
              };
            })
          );
  
          // Return processed order
          return {
            ...order,
            items: processedItems.filter((item) => item !== null), // Filter out invalid items
          };
        })
      );
  
      // Fetch statuses for orders
      const statusIds = processedOrders.map((order) => order.statusId);
      const statuses = await StatusModel.find({ id: { $in: statusIds } }).lean();
      const statusMap = statuses.reduce((acc, status) => {
        acc[status.id] = status;
        return acc;
      }, {});
  
      // Attach status information to each order
      const data = processedOrders.map((order) => ({
        ...order,
        status: statusMap[order.statusId] || null,
      }));

      const category = await CategoryModel.find().lean()
      // Render the view
      res.render('account/order', {
        layout: 'layout',
        data, // Send the array of orders to the view
        customer,
        category
      });
    } catch (error) {
      console.error('Error fetching orders:', error.message);
      res.status(500).send('Internal Server Error');
    }
  });
  
router.post('/update-profile/:id', async (req, res)=>{
    
    const customerId = req.params.id
    const name = req.body.name
    const email = req.body.email
    const phone_number = req.body.phone_number
    const password = req.body.password

    const full_address = req.body.full_address
    const commune = req.body.commune
    const district = req.body.district
    const province = req.body.province
    
    const bank_account_number = req.body.bank_account_number
    const bank_name = req.body.bank_name

    const customerData = {
      name: name,
      email: email,
      password: password,
      phone_number: phone_number,
      full_address: full_address,
      commune: commune,
      district: district,
      province: province,
      bank_account_number: bank_account_number,
      bank_name: bank_name
    }
    await CustomerModel.findByIdAndUpdate(customerId, customerData).lean()

    res.redirect('/account/profile')
  })
router.post('/update-status/:id', async (req, res) => {
    const orderId = req.params.id;
    /*
          Status            -       Action (button)
x       1 pending                     cancel -> status(canceled), if paymethod = cod -> none
1       2 confirmed                   cancel -> status(canceled), if paymethod = ck -> hoàn tiền
x       3 packing                     cancel -> status(canceled), if paymethod = cod -> none, if paymethod = ck -> hoàn tiền
x       4 delivering                  took -> status(delivered)
x       5 delivered                   buy again -> return(/cart) cùng với order được mua lại, rq a refund -> update note
2       6 rq a refund                 view request -> comment của admin reply cho đơn hàng
2       7 acp the refund              view request -> comment của admin reply cho đơn hàng
2       8 refuse the refund           view request -> comment của admin reply cho đơn hàng
2       9 returning                   view request -> comment của admin reply cho đơn hàng
        10 order has arrived to store-buy again -> return(/cart) cùng với order được mua lại, view request -> comment của admin reply cho đơn hàng
        11 canceled                   buy again -> return(/cart) cùng với order được mua lại, view request -> comment của admin reply cho đơn hàng
                          
          */
    try {
      // Lấy thông tin đơn hàng hiện tại
      const order = await OrderModel.findById(orderId);
      if (!order) {
        // Xử lý trường hợp không tìm thấy đơn hàng
        return res.status(404).send('Order not found');
      }
      let newStatusId;
      switch (order.statusId) {
        case 1:
          // Đơn hàng đang ở trạng thái "Chờ xác nhận"
          newStatusId = 11; // Cập nhật trạng thái thành "Đã hủy" (hoặc trạng thái phù hợp)
          break;
        // các case sau làm ở đây
        case 2:
          newStatusId = 11;
          break;
        case 3:
          newStatusId = 11;
          break
        case 4: 
          // Đơn hàng đang ở trạng thái "Chờ lấy hàng"
          newStatusId = 5; // Cập nhật trạng thái thành "Đã lấy hàng" (hoặc trạng thái phù hợp)
          break;
        default:
          // Xử lý các trường hợp status.id khác hoặc trả về lỗi
          return res.status(400).send('Invalid status');
      }
  
      // Cập nhật trạng thái đơn hàng trong database
      await OrderModel.findByIdAndUpdate(orderId, { statusId: newStatusId }, { new: true, lean: true });
      // Chuyển hướng người dùng hoặc trả về kết quả thành công
      res.redirect('/account/order'); 
   
    } catch (error) {
      // Xử lý lỗi
      console.error(error);
      res.status(500).send('Error updating order status');
    }
  });
router.post('/buy-again/:id', async (req, res) => {
    try {
      const orderId = req.params.id;
  
      // Lấy đơn hàng từ database
      const order = await OrderModel.findById(orderId);
      if (!order) {
        return res.status(404).send('Order not found');
      }
  
      // Khôi phục giỏ hàng từ đơn hàng
      const cart = new CartModel({});
      for (let itemId in order.items) {
        const orderItem = order.items[itemId];
        cart.add(orderItem.item, itemId);
      }
  
      // Lưu giỏ hàng vào session
      req.session.cart = cart;
  
      console.log('Cart restored:', req.session.cart);
  
      // Chuyển hướng người dùng
      res.redirect('/cart');
    } catch (error) {
      console.error('Error in buy-again:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  
router.post('/delete/:id', async (req, res) => {
  const {id} = req.params

  const order = await OrderModel.findById(id)
  if(!order) {
    console.log("no order")
  }
  order.isDelete=true
  await order.save()
  res.redirect("/account/order")

  });
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
        message: message,
        isAccepted: false
      };

      // Create and save the new report
      const newReport = new ReportModel(reportData);
      await newReport.save();

      await OrderModel.findByIdAndUpdate(orderId, { statusId: 6 });
      // Redirect with a success message
      res.redirect('/account/order');
    } catch (error) {
      console.error('Error sending report:', error);
      res.status(500).send('Internal Server Error');
    }
  });
module.exports = router; 