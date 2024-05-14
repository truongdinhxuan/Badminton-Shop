const mongoose = require('mongoose');

const Model = new mongoose.Schema(
  {
    id: Number,
    name:  String,
  },
);
    
const Status = mongoose.model("Status", Model, "status");
module.exports = Status;

