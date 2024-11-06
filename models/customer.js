const mongoose = require('mongoose');

const Model = new mongoose.Schema(
  {
    id: Number,
    email: String,
    password: String,
    name: String,
    address: String,
    phone_number: String,
    bank_account_number: String,
    bank_name: String,
    roleID: String
  }
);
    
const Customer = mongoose.model("Customer", Model, "customer");
module.exports = Customer;
