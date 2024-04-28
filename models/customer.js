const mongoose = require('mongoose');

const Model = new mongoose.Schema(
  {
    id: Number,
    fullname: String,
    email: String,
    password: String,
    photo: String,
    roles: Object,
    isDeleted: Boolean
  },
  {
    collection: 'customer'
  }
);
    
module.exports = mongoose.model('customer', Model);
