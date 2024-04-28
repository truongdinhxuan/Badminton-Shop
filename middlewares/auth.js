
const AdminModel = require('../models/admin')
const CustomerModel = require('../models/customer')
const RoleModel = require('../models/roles')

const checkLoginSession = (req, res, next) => {
    if (req.session.email) {
      next();
    } else {
      res.redirect("/auth/login");
      return;
    }
};

const checkAdminSession = async (req, res, next) => {
  var admin = await AdminModel.findOne({ email: req.session.email });
  if (admin) {
    var role = await RoleModel.findById(admin.roleID);
    if (req.session.email && role && role.roleName == "admin") {
      next();
    }
  } else {
    res.redirect("/auth/login");
    return;
  }
};
// const checkCustomerSession = async (req, res, next) => {
//   const user = await UserModel.findOne({ email: req.session.email });
//   if (!user) {
//     res.redirect("/auth/login");
//     return;
//   }
//   // Check if the user has the customer role
//   if (user.roles.includes("CUSTOMER")) {
//     next();
//   } else {
//     res.redirect("/auth/login");
//   }
// };

module.exports={
  checkLoginSession,
  checkAdminSession,
  // checkCustomerSession
}