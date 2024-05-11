const mongoose = require('mongoose');

const Model = new mongoose.Schema(
  {
    id: Number,
    categoryId: Number,
    name:  String,
    urlRewriteName: String,
  },
);
    
const Brand = mongoose.model("Brand", Model, "brand");
module.exports = Brand;

