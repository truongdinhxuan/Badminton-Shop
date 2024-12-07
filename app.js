var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var hbs = require("hbs");
var mongoose = require("mongoose");
const flash = require('connect-flash');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const fs = require('fs');
var app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', "hbs");

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('files'))
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));
// Connect-flash middleware
// app.use(flash());


// MongoDB connection

// REAL DATA
var uri = "mongodb+srv://truongdinh12002:truongdinh12002@shopping.46ohfvc.mongodb.net/shopping";

// TEST SERVER
// var uri = "mongodb+srv://truongdinh12002:truongdinh12002@shopping.46ohfvc.mongodb.net/test";

// TEST LOCAL
// var uri = "mongodb://localhost:27017/shopping";

mongoose.connect(uri)
  .then(() => console.log("Database Successfully Connected"))
  .catch((error) => console.log(error));

// Express session middleware
//set session timeout
const timeout = 10000 * 60 * 60 * 24; // 24 hours (in milliseconds)
//config session parameters
app.use(
  session({
    secret: "practice_makes_perfect", // Secret key for signing the session ID cookie
    resave: false, // Forces a session that is "uninitialized" to be saved to the store
    saveUninitialized: true, // Forces the session to be saved back to the session store
    store: MongoStore.create({
      mongoUrl: uri, // uri là địa chỉ MongoDB
    }),
    cookie: { maxAge: timeout },
  })
);
app.use(flash());
app.use((req, res, next) => {
  res.locals.successMessage = req.flash('success');
  res.locals.errorMessage = req.flash('error');
  next();
});
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));

// Make session value accessible in views (hbs)
app.use((req, res, next) => {
  res.locals.email = req.session.email;
  res.locals.session = req.session;
  next();
});

// Middleware to check admin session
const { checkAdminSession } = require("./middlewares/auth");
app.use("/admin", checkAdminSession);


// Routes
app.use('/', require('./routes/index'));
app.use('/admin', require('./routes/admin'));
app.use('/auth', require('./routes/auth'));
app.use('/account', require('./routes/account'));
app.use('/product', require('./routes/product'));
app.use('/cart', require('./routes/cart'));
app.use('/category', require('./routes/category'));
app.use('/order', require('./routes/order'));
app.use('/checkout', require('./routes/checkout'));

// Register Helper
hbs.registerHelper('ifEq', function(arg1, arg2, options) {
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});
// hbs.registerHelper('or', function() {
//   return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
// });
hbs.registerHelper('eq', function(a, b) {
  return a === b;
});
hbs.registerHelper('includes', function(array, value) {
  return array.includes(value);
});
hbs.registerHelper('ifIn', function(value, ...args) {
  const options = args[args.length - 1]; // Lấy options từ Handlebars
  const values = args.slice(0, -1); // Lấy các giá trị so sánh
  
  // Kiểm tra nếu value nằm trong danh sách giá trị truyền vào
  for (let i = 0; i < values.length; i++) {
    if (value == values[i]) {
      return options.fn(this); // Nếu đúng, thực hiện block bên trong
    }
  }
  return options.inverse(this); // Nếu sai, thực hiện block {{else}}
});
hbs.registerHelper('truncate', function (str, len) {
  if (str.length > len) {
      return str.substring(0, len) + '...';
  }
  return str;
});
hbs.registerHelper('subtract', function(a, b) {
  return a - b;
});
hbs.registerHelper('gt', function (a, b) {
  return a > b;
});
hbs.registerHelper('lt', function (a, b) {
  return a < b
});
hbs.registerHelper('length', function (obj) {
  return Object.keys(obj).length;
});


// Catch 404 and forward to error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error", { layout: "error_layout" });
});

module.exports = app;
