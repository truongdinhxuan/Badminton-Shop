const mongoose = require('mongoose');

const Model = new mongoose.Schema(
  {
    email: String,
    password: String,
    name: String,
    roleID: String,
    photo: String,
  }
);
    
const Customer = mongoose.model("Customer", Model, "customer");
module.exports = Customer;
