const mongoose = require('mongoose');

const Model = new mongoose.Schema(
  {
    id: Number,
    orderId: Number,
    title: String,
    message:  String,
    isAccepted: Boolean,
  },
);
    
const Report = mongoose.model("Report", Model, "report");
module.exports = Report;

