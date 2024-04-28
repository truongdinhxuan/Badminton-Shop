var mongoose = require("mongoose");

const Model = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
  roleID: String,
});

const Admin = mongoose.model("Admin", Model, "admin");
module.exports = Admin;
