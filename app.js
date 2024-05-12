var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var hbs = require("hbs");
var mongoose = require("mongoose");
const flash = require('connect-flash');
const session = require('cookie-session');
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

// Express session middleware
//set session timeout
const timeout = 10000 * 60 * 60 * 24; // 24 hours (in milliseconds)
//config session parameters
app.use(
  session({
    secret: "practice_makes_perfect", // Secret key for signing the session ID cookie
    resave: false, // Forces a session that is "uninitialized" to be saved to the store
    saveUninitialized: true, // Forces the session to be saved back to the session store
    cookie: { maxAge: timeout },
  })
);
// MongoDB connection
var uri = "mongodb+srv://truongdinh12002:truongdinh12002@shopping.46ohfvc.mongodb.net/shopping";
// var uri = "mongodb://localhost:27017/shopping";

mongoose.connect(uri)
  .then(() => console.log("Database Successfully Connected"))
  .catch((error) => console.log(error));



var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));

// Make session value accessible in views (hbs)
app.use((req, res, next) => {
  res.locals.email = req.session.email;
  next();
});

// Middleware to check admin session
const { checkAdminSession } = require("./middlewares/auth");
app.use("/admin", checkAdminSession);


// Routes
app.use('/', require('./routes/index'));
app.use('/admin', require('./routes/admin'));
app.use('/auth', require('./routes/auth'));

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
