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
    
Model.plugin(require('../modules/auto-increment').getInstance().plugin, {
  model: 'category',
  field: 'id'
});

module.exports = mongoose.model('category', Model);
