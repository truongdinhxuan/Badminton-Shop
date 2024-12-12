var express = require("express");
var router = express.Router();
const { checkLoginSession } = require("../middlewares/auth");
const CustomerModel = require('../models/customer')
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
    const countCanceledOrder = await OrderModel.findOne({statusId: 11, paymentMethod: 'bank', isDelete: false}).countDocuments()
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
    const order_need_to_refund = updateOrder.paymentMethod==='bank' && updateOrder.statusId===11
    let orderCode = updateOrder.orderCode
    const status = await StatusModel.find({}).lean()
    const report = await ReportModel.findOne({ orderId: orderCode }).lean();
  
    const selectedStatus = status.find(status => status.id === updateOrder.statusId)
  
    let activeSteps = [];
    let showreturnsteps = false;
    let showcancelsteps = false;
    let showrefusesteps = false;
    let showrefundcompletesteps = false;
    if (updateOrder.statusId >= 6 && updateOrder.statusId <= 12) {
      showreturnsteps = true; // Hiển thị bước hoàn trả hàng nếu status là 6, 7, hoặc 8
    }
    if (updateOrder.statusId == 11) {
      showcancelsteps = true
    }
    if (updateOrder.statusId == 8) {
      showrefusesteps = true
    }
    if (updateOrder.statusId == 12) {
      showrefundcompletesteps = true
    }
    // hoàn trả
    if (updateOrder.statusId === 6) {
      activeSteps = [6]
    } else if (updateOrder.statusId === 7) {
      activeSteps = [6,7]
    // refuse step
    } else if (updateOrder.statusId === 8) {
      activeSteps = [8]
    } else if (updateOrder.statusId === 9) {
      activeSteps = [6,7,9]
    } else if (updateOrder.statusId === 10) {
      activeSteps = [6,7,9,10]
    // show only refund step
    } else if (updateOrder.statusId === 12) {
      activeSteps = [12]
    // Cancel step
    } else if (updateOrder.statusId === 11) {
      activeSteps = [11]
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
  
    const customer = await CustomerModel.findOne({id: updateOrder.buyerId}).lean()

    
    res.render('staff/order/update-order', {
      layout: 'staff/layout',
      updateOrder: updateOrder,
      status: status,
      selectedStatus: selectedStatus,
      report: report,
      activeSteps: activeSteps,
      showreturnsteps: showreturnsteps,
      showcancelsteps: showcancelsteps,
      showrefusesteps: showrefusesteps,
      showrefundcompletesteps: showrefundcompletesteps,
      order_need_to_refund,
      customer
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
        let newStatusId = req.body.newStatusId;
        // const newStatusId = req.body.action === 'accept' ? 7 : 8; // Example: 7 for "Accepted", 8 for "Refused"
        
        switch (newStatusId) {
          case 'confirm':
              newStatusId = 2; // Order confirmed
              break;
          case 'pack':
              newStatusId = 3; // Packing order
              break;
          case 'deliver':
              newStatusId = 4; // Delivering
              break;
          case 'delivered':
              newStatusId = 5; // Delivering
              break;
          case 'accept':
              newStatusId = 7 //acpt
            break;
          case 'return':
            newStatusId = 9 
          break;
          case 'arrived':
              newStatusId = 10 //acpt
            break;
          case 'refuse':
              newStatusId = 8 //rf
            break;  
          case 'refunded':
              newStatusId = 12 //rf
            break;  
          default:
              req.flash('error', 'Invalid action.');
              return res.redirect(`/staff/update-order/${id}`);
      }
        // Update the order's status
        const updatedOrder = await OrderModel.findOneAndUpdate(
            { _id: id },
            { statusId: newStatusId },
            { new: true }
        );
  
        if (updatedOrder) {
          // Nếu đơn hàng đã được cập nhật, kiểm tra và cập nhật báo cáo
          const report = await ReportModel.findOne({ orderId: updatedOrder.orderCode }).lean();
          if (report) {
              // Chỉ cập nhật trường isAccepted nếu trạng thái là 'accept'
              if (newStatusId === 7 || newStatusId === 8) { // Chỉ cập nhật isAccepted nếu trạng thái là "Accepted"
                  await ReportModel.findOneAndUpdate(
                      { orderId: updatedOrder.orderCode },
                      { isAccepted: true },
                      { new: true }
                  );
              }
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