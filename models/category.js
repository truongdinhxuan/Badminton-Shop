const mongoose = require('mongoose');

const Model = new mongoose.Schema(
  {
    id: Number,
    name:  String,
    slug: {
      type: String,
      unique: true,
      required: true
    }
  },
);
    
const Category = mongoose.model("Category", Model, "category");
module.exports = Category;

