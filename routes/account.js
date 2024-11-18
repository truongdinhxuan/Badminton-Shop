var express = require("express");
var router = express.Router();

const CustomerModel = require('../models/customer');
const OrderModel = require('../models/order');
var StatusModel = require('../models/status');
var ReportModel = require('../models/report')
router.get('/', async (req, res) => {

    const customerEmail = req.session.email; // Get email from session
      // Fetch customer ID based on email
    const customer = await CustomerModel.findOne({ email: customerEmail }).lean();
    if (!customer) {
      // Handle the case where no customer is found (e.g., redirect to login)
      return res.redirect('/auth'); 
    }
    // const customerId = customer.id;
    // // Find orders associated with the customer
    // const orders = await OrderModel.find({ buyerId: customerId, isDelete: false }).lean();

    // const statusIds = orders.map(order => order.statusId);
    // const status = await StatusModel.find({ id: { $in: statusIds } }).lean();
    // const statusMap = status.reduce((acc, status) => {
    //   acc[status.id] = status;
    //   return acc;
    // }, {});
    // console.log(status)
    // const data = orders.map(order => ({
    //   ...order,
    //   status: statusMap[order.statusId] || null
    // }));
    // // Hiện tại chỉ dùng name để lưu, việc craw khiến việc data thừa load khá lâu
    // const bank = {
    //   "bank": [
    //     {"name": "Vietcombank"},
    //     {"name": "Agribank"},
    //     {"name": "BIDV"},
    //     {"name": "Vietinbank"},
    //     {"name": "Techcombank"},
    //     {"name": "ACB"},
    //     {"name": "MB"},
    //     {"name": "Sacombank"},
    //     {"name": "DongA Bank"},
    //     {"name": "Eximbank"},
    //     {"name": "ABBank"},
    //     {"name": "TPBank"},
    //     {"name": "VPBank"},
    //     {"name": "SCB"},
    //     {"name": "Viet Capital Bank"},
    //     {"name": "LienVietPostBank"},
    //     {"name": "MSB"},
    //     {"name": "Nam A Bank"},
    //     {"name": "OCB"},
    //     {"name": "SHB"}
    //   ]
    // }
    res.render('account', {
      layout: 'layout',
      // data, // Send the array of orders to the view,
      customer: customer,
      // bank: bank.bank
    });
  })
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
  const customerEmail = req.session.email; // Get email from session
  // Fetch customer ID based on email
  const customer = await CustomerModel.findOne({ email: customerEmail }).lean();
  if (!customer) {
    // Handle the case where no customer is found (e.g., redirect to login)
    return res.redirect('/auth'); 
  }
  const customerId = customer.id;
  // Find orders associated with the customer
  const orders = await OrderModel.find({ buyerId: customerId, isDelete: false }).lean();

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
  console.log(data)
  res.render('account/order', {
    layout: 'layout',
    data, // Send the array of orders to the view,
    customer: customer,
  });
  })
router.post('/update-profile/:id', async (req, res)=>{
    
    const customerId = req.params.id
    const name = req.body.name
    const email = req.body.email
    const password = req.body.password
    const country = req.body.country
    const address = req.body.address
    const phone_number = req.body.phone_number
    const bank_account_number = req.body.bank_account_number
    const bank_name = req.body.bank_name

    const customerData = {
      name: name,
      email: email,
      password: password,
      country: country,
      address: address,
      phone_number: phone_number,
      bank_account_number: bank_account_number,
      bank_name: bank_name
    }
    await CustomerModel.findByIdAndUpdate(customerId, customerData).lean()

    res.redirect('/account')
  })
router.post('/update-status/:id', async (req, res) => {
    const orderId = req.params.id;
    /*
          Status            -       Action (button)
x       1 pending                     cancel -> status(canceled), if paymethod = cod -> none
        2 confirmed                   cancel -> status(canceled), if paymethod = ck -> hoàn tiền
x       3 packing                     cancel -> status(canceled), if paymethod = cod -> none, if paymethod = ck -> hoàn tiền
x       4 delivering                  took -> status(delivered)
        5 delivered                   buy again -> return(/cart) cùng với order được mua lại, rq a refund -> update note
        6 rq a refund                 
        7 acp the refund
        8 refuse the refund
        9 returning
        10 order has arrived to store-buy again -> return(/cart) cùng với order được mua lại
        11 canceled                   buy again -> return(/cart) cùng với order được mua lại
                          
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
      res.redirect('/account'); 
   
    } catch (error) {
      // Xử lý lỗi
      console.error(error);
      res.status(500).send('Error updating order status');
    }
  });
router.post('/buy-again', (req, res) => {
    const orderId = req.body.orderId;
    const userSession = req.session;
  
    // Retrieve the previous order data from session (or database if needed)
    const order = userSession.orders.find(order => order.id === orderId);
    if (!order) {
      return res.status(400).json({ message: 'Order not found' });
    }
  
    // Assuming your session cart structure looks like this:
    if (!userSession.cart) {
      userSession.cart = { items: {}, totalQty: 0, totalPrice: 0 };
    }
  
    // Add items from the previous order to the cart
    order.items.forEach(item => {
      if (!userSession.cart.items[item.id]) {
        userSession.cart.items[item.id] = item;
        userSession.cart.totalQty += item.qty;
        userSession.cart.totalPrice += item.qty * item.price;
      } else {
        userSession.cart.items[item.id].qty += item.qty; // Add more if the item is already in cart
        userSession.cart.totalQty += item.qty;
        userSession.cart.totalPrice += item.qty * item.price;
      }
    });
  
    // Save the updated session and send a response
    req.session.cart = userSession.cart;
    res.json({ message: 'Cart updated successfully' });
  });
router.post('/delete/:id', async (req, res) => {
  const {id} = req.params

  const order = await OrderModel.findById(id)
  if(!order) {
    console.log("no order")
  }
  order.isDelete=true
  await order.save()
  res.redirect("/account")

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
        message: message
      };

      // Create and save the new report
      const newReport = new ReportModel(reportData);
      await newReport.save();

      await OrderModel.findByIdAndUpdate(orderId, { statusId: 6 });
      // Redirect with a success message
      res.redirect('/account');
    } catch (error) {
      console.error('Error sending report:', error);
      res.status(500).send('Internal Server Error');
    }
  });
module.exports = router; 