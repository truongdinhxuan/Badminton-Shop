var express = require("express");
var router = express.Router();

const AdminModel = require('../models/admin')
const CustomerModel = require('../models/customer')
const RoleModel = require('../models/roles')

router.get("/login", function (req, res, next) {
    res.render("auth/login");
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
    } catch (err) {
        console.error(err);
        res.render("auth/login", { 
          message: "Internal Server Error" 
        });
    }
});
module.exports = router;