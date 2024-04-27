const mongoose = require('mongoose');

const Model = new mongoose.Schema(
  {
    id: Number,
    name:  String,
    urlRewriteName: String,
    isDeleted: Boolean
  },
  {
    collection: 'category'
  }
);
    


module.exports = mongoose.model('category', Model);
