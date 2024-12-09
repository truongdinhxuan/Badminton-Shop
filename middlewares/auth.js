
const AdminModel = require('../models/admin')
const CustomerModel = require('../models/customer')
const StaffModel = require('../models/staff');
const RoleModel = require('../models/roles');

const checkLoginSession = (req, res, next) => {
    if (req.session.email) {
      next();
    } else {
      res.redirect("/auth");
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
    res.redirect("/auth");
    return;
  }
};
const checkCustomerSession = async (req, res, next) => {
  var customer = await CustomerModel.findOne({ email: req.session.email });
  if (customer) {
    var role = await RoleModel.findById(customer.roleID);
    if (req.session.email && role && role.roleName == "customer") {
      next();
    }
  } else {
    res.redirect("/auth");
    return;
  }
};
const checkStaffSession = async (req, res, next) => {
  var staff = await StaffModel.findOne({ email: req.session.email });
  if (staff) {
    var role = await RoleModel.findById(staff.roleID);
    if (req.session.email && role && role.roleName == "staff") {
      next();
    }
  } else {
    res.redirect("/auth");
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
const checkMultipleSession = (allowedRoles) => (req, res, next) => {
  if (req.session.email && allowedRoles.includes(req.session.role)) {
    next();
  } else {
    res.redirect("/auth");
  }
};
module.exports={
  checkLoginSession,
  checkAdminSession,
  checkCustomerSession,
  checkStaffSession,
  checkMultipleSession
}