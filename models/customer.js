const mongoose = require('mongoose');

const Model = new mongoose.Schema(
  {
    id: Number,
    email: String,
    password: String,
    name: String,
    phone_number: String,
    // address
    full_address: String,
    commune: String,
    district: String,
    province: String,
    // bank 
    bank_account_number: String,
    bank_name: String,
    roleID: String,
    isDisable: Boolean
  }
);
    
const Customer = mongoose.model("Customer", Model, "customer");
module.exports = Customer;
