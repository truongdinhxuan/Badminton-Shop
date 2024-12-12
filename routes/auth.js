var express = require("express");
var router = express.Router();

const AdminModel = require('../models/admin');
const CustomerModel = require('../models/customer')
const StaffModel = require('../models/staff')
const RoleModel = require('../models/roles')

router.get("/", function (req, res, next) {
    res.render('auth');
  });
router.post("/login", async (req, res) => {
    var email = req.body.email;
    var password = req.body.password;

    console.log(role)
    try {
      var admin = await AdminModel.findOne({
        email: email,
        password: password,
      }).lean();
      if (admin) {
        var role = await RoleModel.findById(admin.roleID).lean();
        if (role && role.roleName == "admin") {
          req.session.email = admin.email;
          return res.redirect("/admin");
        }
      }
      var customer = await CustomerModel.findOne({
        email: email,
        password: password,
      }).lean();
      if (customer) {
        var role = await RoleModel.findById(customer.roleID).lean();
        if (role && role.roleName == "customer") {
          if(customer.isDisable === true) {
            return res.render('auth', {
              message: 'Your account is disabled'
            })
          } else {
            req.session.email = customer.email;
            return res.redirect("/");
          } 
        }
      }
      var staff = await StaffModel.findOne({
        email: email,
        password: password,
      }).lean();
      if (staff) {
        var role = await RoleModel.findById(staff.roleID).lean();
        if (role && role.roleName == "staff") {
          req.session.email = staff.email;
          return res.redirect("/staff/order");
        }
      }
      res.render('auth', { 
        // layout: "auth_layout" ,
        message: "Invalid email or password" 
      });
    } catch (err) {
        console.error(err);
        res.render('auth', { 
          message: "Internal Server Error" 
        });
    }
});
router.post("/register", async (req, res) => {
  const name = req.body.name
  const email = req.body.email
  const password = req.body.password
  const customerRole = await RoleModel.findOne({roleName: "customer"}).lean();
  
  const existingCustomer = await CustomerModel.findOne({
    email: email
  })
  if(existingCustomer) {
    return res.render('auth',{
      message: 'Duplicate email'
    })
  }

  var customer = {
    id: await CustomerModel.countDocuments() + 1,
    email: email,
    password: password,
    name: name,
    roleID: customerRole._id
  }

  await CustomerModel.create(customer)
  res.redirect('/auth')
  });
  
router.get("/logout", (req, res) => {
    req.session.destroy((err) => {
    if (err) {
        console.error("Error destroying session:", err);
        return;
    }
    res.redirect("/");
});
});
  
module.exports = router;