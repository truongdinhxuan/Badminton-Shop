var mongoose = require("mongoose");

const Model = new mongoose.Schema({
  roleName: String,
});

const Role = mongoose.model("Role", Model, "roles");
module.exports = Role;
