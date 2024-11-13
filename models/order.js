const mongoose = require('mongoose');

const Model = new mongoose.Schema(
  {
    orderCode: Number,
    buyerId: Number,
    buyerName: String,
    buyerEmail: String,
    buyerPhone: String,
    buyerAddress: String,
    buyerCountry: String,
    buyerNote: String,
    amount: Number,
    paymentMethod: String,
    items: Object,
    statusId: Number,
    note: String,
    orderDate: String,
    isDelete: Boolean
  },
);
    
const Order = mongoose.model("Order", Model, "order");
module.exports = Order;

