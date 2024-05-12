const mongoose = require('mongoose');

const Model = new mongoose.Schema(
  {
    orderCode: Number,
    name: String,
    email: String,
    phone: String,
    address: String,
    country: String,
    note: String,
    amount: Number,
    payMethod: String,
    details: Object
  },
);
    
const Order = mongoose.model("Order", Model, "order");
module.exports = Order;

