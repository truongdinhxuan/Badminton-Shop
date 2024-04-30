const mongoose = require('mongoose');

const Model = new mongoose.Schema(
  {
    id: Number,
    name:  String,
    urlRewriteName: String,
    isDeleted: Boolean
  },
);
    
const Category = mongoose.model("Category", Model, "category");
module.exports = Category;

