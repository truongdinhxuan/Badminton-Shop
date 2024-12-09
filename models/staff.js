var mongoose = require("mongoose");

const Model = new mongoose.Schema({
  id: Number,
  email: String,
  password: String,
  name: String,
  phone_number: String,
  roleID: String,
  isDisable: Boolean
});

const Staff = mongoose.model("Staff", Model, "staff");
module.exports = Staff;
