var express = require("express");
var router = express.Router();
const { checkLoginSession } = require("../middlewares/auth");
const StaffModel = require('../models/staff')
const OrderModel = require('../models/order')
const ProductModel = require('../models/product')
const StatusModel = require('../models/status')
const ReportModel = require('../models/report')
router.get('/',checkLoginSession, async (req, res) => {
    // Dashboard.... Chinh sau
    // const order = await OrderModel.find().count();
    // const product = await ProductModel.find().count();
    const user = await  StaffModel.findOne({ email: req.session.email }).lean();
    
    res.render("staff", {
    layout: "staff/layout",
    staff: user.name,
    // order: order,
    // product: product
    });
});
router.get('/order', async (req ,res) => {
    const orders = await OrderModel.find({isDelete: false}).lean();
    
    const orderData = await Promise.all(
      orders.map(async (order) => {
          const status = await StatusModel.findOne({id: order.statusId}).lean();
          const report = await ReportModel.findOne({ orderId: order.orderCode, isAccepted: false}).lean();
          return {
              ...order,
              iscancelled: status && status.name === 'Canceled' && order.paymentMethod === 'bank',
              statusName: status ? status.name : 'Unknow',
              reportTitle: report ? report.title : null,
              reportMessage: report ? report.message : null,
          };
      })
    );
  
    // console.log(orderData)
  
    const countReport = await ReportModel.countDocuments({isAccepted: false})
    const countCanceledOrder = await OrderModel.findOne({statusId: 11, paymentMethod: 'bank'}).countDocuments()
    // const bigData = await Promise.all(orders.map(async (order) => {
    //   const status = await StatusModel.findOne({id: order.statusId}).lean();
    //   return {
    //     ...order,
    //     statusName: status ? status.name : 'Unknow'
    //   };
    // }))   
    res.render('staff/order' , {
      layout: 'staff/layout',
      // data: bigData,
      order: orderData,
      countReport: countReport,
      countCanceledOrder: countCanceledOrder
    })
  })
  router.get('/update-order/:id', async (req,res) => {
    const orderId = req.params.id
    const updateOrder = await OrderModel.findById(orderId).lean()
    let orderCode = updateOrder.orderCode
    const status = await StatusModel.find({}).lean()
    const report = await ReportModel.findOne({ orderId: orderCode }).lean();
  
    const selectedStatus = status.find(status => status.id === updateOrder.statusId)
  
    let activeSteps = [];
    let showreturnsteps = false;
  
    if (updateOrder.statusId >= 6 && updateOrder.statusId <= 10) {
      showreturnsteps = true; // Hiển thị bước hoàn trả hàng nếu status là 6, 7, hoặc 8
    }
    // hoàn trả
    if (updateOrder.statusId === 6) {
      activeSteps = [6]
    } else if (updateOrder.statusId === 7) {
      activeSteps = [6,7]
    } else if (updateOrder.statusId === 8) {
      activeSteps = [6,7.8]
    // giao hàng
    } else if (updateOrder.statusId === 1) {
      activeSteps = [1]; // chỉ step 1 active
    } else if (updateOrder.statusId === 2) {
      activeSteps = [1, 2]; // step 1 và 2 active
    } else if (updateOrder.statusId === 3) {
      activeSteps = [1, 2, 3]; // step 1, 2 và 3 active
    } else if (updateOrder.statusId == 4) {
      activeSteps = [1,2,3,4]
    } else if (updateOrder.statusId == 5) {
      activeSteps = [1,2,3,4,5]
    }
  
    // const formatMoney = new Intl.NumberFormat('vi-VI', {
    //   style: 'currency',
    //   currency: 'VND'
    // }).format(updateOrder.amount)
    
    res.render('staff/order/update-order', {
      layout: 'staff/layout',
      updateOrder: updateOrder,
      status: status,
      selectedStatus: selectedStatus,
      report: report,
      activeSteps: activeSteps,
      showreturnsteps: showreturnsteps,
     
    })
  })
  router.post('/update-order/:id', async (req, res) => {
    try { 
      const orderId = req.params.id;
      const data = req.body;
      const updatedOrder = await OrderModel.findByIdAndUpdate(orderId, data, { new: true }).lean();
      if (!updatedOrder) {
        console.error(`Order with ID ${orderId} not found`);
        return res.status(404).send("Order not found");
      }
      const orderCode = updatedOrder.orderCode;
      if (!orderCode) {
        console.error("Order code is missing");
        return res.status(400).send("Order code is missing");
      }
      await ReportModel.findOneAndDelete({ orderId: orderCode }).lean();
  
      res.redirect('/staff/order');
    } catch (errors) {
      console.error("Error updating order:", errors);
      res.redirect('/staff');
    }
  });
  router.post('/update-status-order/:id', async (req, res) => {
    try {
        // Get the order ID from the URL
        const id = req.params.id;
        const newStatusId = req.body.action === 'accept' ? 7 : 8; // Example: 7 for "Accepted", 8 for "Refused"
        
        // Update the order's status
        const updatedOrder = await OrderModel.findOneAndUpdate(
            { _id: id },
            { statusId: newStatusId },
            { new: true }
        );
  
        if (updatedOrder) {
            // If the order is updated, proceed to update the report
            const report = await ReportModel.findOne({ orderId: updatedOrder.orderCode }).lean(); // Use orderCode from OrderModel to find the report
            if (report) {
                // Update isAccepted status in ReportModel
                await ReportModel.findOneAndUpdate(
                    { orderId: updatedOrder.orderCode }, // Ensure the report is matched using orderCode
                    { isAccepted: req.body.action === 'accept' }, // Set isAccepted based on the action (accept or not)
                    { new: true }
                );
                req.flash('success', `Order status updated to ${newStatusId === 7 ? 'Accepted' : 'Refused'}`);
            } else {
                req.flash('error', 'Report not found for the order.');
            }
        } else {
            req.flash('error', 'Order not found or could not be updated.');
        }
  
        // Redirect back to the orders page
        res.redirect(`/staff/update-order/${id}`);
    } catch (error) {
        console.error('Error updating order status:', error);
        req.flash('error', 'An error occurred while updating the order status.');
        res.redirect('/staff/order');
    }
  });
  router.get('/order/isdeleted', async (req,res) => {
    const deleteOrder = await OrderModel.find({statusId: 11}).lean()
  
    res.render('staff/order/isdeleted',{
      layout: 'staff/layout',
      deleteOrder: deleteOrder
    })
  })
module.exports = router;