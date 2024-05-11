const mongoose = require('mongoose');

const Model = new mongoose.Schema(
  {
    id: Number,
    categoryId: Number,
    brandId: Number,
    name: String,
    urlRewriteName: String,
    photo: String,
    description: String,
    price: Number,
    isDisplay: Boolean
    // sale: Number,
    // sale1: Number,
    // salePrice: Number,
    // isDeleted: Boolean,  
  },
);
const Product = mongoose.model("Product", Model, "product");
module.exports = Product;
