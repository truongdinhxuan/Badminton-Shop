var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var hbs = require("hbs");
var indexRouter = require('./routes/index');
var adminRouter = require('./routes/admin');
var mongoose = require("mongoose");


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', "hbs");
app.set('views', './views')

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());


app.use(express.static(path.join(__dirname + '../public')));

app.use('/', indexRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

//view settings
app.use('/', require('./routes/index'));


// connection
var uri =
"mongodb://localhost:27017/shopping";



mongoose
  .connect(uri)
  .then(() => console.log("Database Successfully Connected"))
  .catch((error) => console.log(error));
module.exports = app;
