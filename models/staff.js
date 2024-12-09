var mongoose = require("mongoose");

const Model = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
  roleID: String,
});

const Staff = mongoose.model("Staff", Model, "staff");
module.exports = Staff;
