const LocalStrategy = require('passport-local').Strategy;
const Passport = require('passport');
const UserModel = require('../models/user');
const UserRole = require('../constants/user-role');

Passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password'
      }, async (username, password, done) => {
        const docUser = await UserModel.findOne(
          {
            email: username
          }
        ).lean();
  
        if (!docUser || !docUser.id) {
          return done(null, false, { message: 'Tài Khoản Không Đúng2' });
        }
        else {
          require('bcryptjs').compare(password, docUser.password, (err, data) => {
            if (err) {
              throw err;
            }
            else if (!data) {
              return done(null, false, { message: 'Tài Khoản Không Đúng1' });
            }
            
            return done(null, docUser);
          });
        }
      }
    )
  );
// Lưu thông tin đăng nhập bẳng 1 cái id
Passport.serializeUser((credential, done) => {
    done(null, credential.id);
  });
  
  // Lấy thông tin ra bẳng 1 cái id 
  Passport.deserializeUser(async (id, done) => {
    const docUser = await UserModel.findOne(
      {
        id
      }
    ).lean();
    
    if (docUser && docUser.id) {
      done(null, docUser);
    }
  });
  
module.exports.auth = () => {
    return Passport.authenticate(
    'local', {
        // successRedirect: '/',
        failureRedirect: '/admin/login',
        failureFlash: true
    }
    );
};

module.exports.requireAuth = async (req, res, next, checkAdmin = true) => {
  let bIsValid = false;

  if (req.isAuthenticated() === true) {
    if (!checkAdmin) {
      bIsValid = true;
    }
    else {
      const docUser = await UserModel.findOne(
        {
          id: req.session.passport.user
        }
      ).lean();

      if (docUser && docUser.roles) {
        let bIsAdmin = false;
        // let bIsStocker = false;
        let bIsCustomer = false;

        for (const x of docUser.roles) {
          if (bIsAdmin === true) {
            break;
          }
          else {
            bIsValid = true;

            switch (x) {
              case UserRole.admin:
                bIsAdmin = true;
                break;
              // case UserRole.stocker:
              //   bIsStocker = true;
              //   break;
              case UserRole.customer:
                bIsCustomer=true;
                break;
            }
          }
        }
        
        if (bIsValid === true) {
          if (bIsAdmin === true) {
            // bIsStocker = false;
            bIsCustomer=false;
          }

          // if (bIsStocker === true && req.baseUrl.toLowerCase().startsWith('/admin/user') === true) {
          //   bIsValid = false;
          // }
          if (bIsCustomer === true && req.baseUrl.toLowerCase().startsWith('/') === true) {
            bIsValid = false;
          }
        }
      }
    }
  }
  
  if (bIsValid === true) {
    next();
  }
  else {
    return res.redirect(`/admin/login?returnUrl=${encodeURI(req.originalUrl)}`);
  }
};
