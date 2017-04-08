// a taste of login! - express app demonstrating registration and login
// express static setup

var fs = require('fs');
var express = require('express');
var hbs = require('hbs');
var expressSess = require("express-session");
//var sleep = require('sleep');
require('./db');
var passport = require("passport");
var mongoose = require('mongoose');
const URLSlugs = require('mongoose-url-slugs');
var bodyParser = require("body-parser");
var app = express();
app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
var RedisStore = require('connect-redis')(expressSess);

module.exports = function Sessions(url, secret) {
  var store = new RedisStore({ url: url });
  var session = expressSession({
    secret: secret,
    store: store,
    resave: true,
    saveUninitialized: true
  });

  return session;
};

var Schema = mongoose.Schema;
const LocalStrategy = require('passport-local').Strategy
var session = {};
var User = mongoose.model('User');
var bcrypt = require('bcrypt');
passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

app.use(passport.initialize());
app.use(passport.session());
const sessionOptions = {
	secret: 'secret cookie thang (store this elsewhere!)',
	resave: true,
	saveUninitialized: true
};
app.use(expressSess(sessionOptions));

app.get('/restricted',function(req,res){
  if(!req.session.username){
    res.redirect('login');
  }
  else{
    res.render('redirect',{css_file:"/base.css"});
  }
});

app.get('/logout',function(req,res,next){
  req.session.destroy();
  res.redirect('/');
});

  app.post('/login', function(req, res,next) {
      User.findOne({'username':req.body.username},function(err, user,count) {
      if(!err && user) {
          if(bcrypt.hashSync(req.body.password,user.pwSalt) == user.password){
            req.session.regenerate((err) => {
              if (!err) {
                req.session.username = user.username;
                req.session.password = user.password;
              } else {
                console.log('error');
                res.send('an error occurred, please see the server logs for more information');
              }
            });
            req.logIn(user, function(err) {
              res.render('home',{css_file:"/base.css",username:user.username});
            });
          }
          else{
            res.render('login', {message:'Your login or password is incorrect.',css_file:"/base.css"});
          }
      } else {
        res.render('login', {message:'Your login or password is incorrect.',css_file:"/base.css"});
      }
    });
      });

app.post('/register', function(req, res) {
  User.findOne({'username':req.body.username},function(err, user) {
    if (err){
      console.log('Error in SignUp: '+err);
      return (err);
    }
    if (user) {
        res.render('register',{message:'User Already Exists',css_file:"/base.css"});
    } else {
        if(req.body.password.length < 8){
        console.log('Not long enough');
        res.render('register',{message:'Password needs to be at least 8 characters long!',css_file:"/base.css"});
        }
        else{
          var newUser = new User();
          newUser.username = req.body.username;
          var pw = newUser.generateHash(req.body.password);
          newUser.password = pw.hash;
          newUser.pwSalt = pw.salt;

          newUser.save(function(err) {
            if (err){
              console.log('Error in Saving user: '+err);
              throw err;
            }
            console.log('User Registration succesful');
            res.render('home',{css_file:"/base.css",username:req.session.username});
          });
      req.session.regenerate((err) => {
        if (!err) {
          req.session.username = newUser.username;
          req.session.password = newUser.password;
        } else {
          console.log('error');
          res.send('an error occurred, please see the server logs for more information');
        }
      });
    }
    }
    });
  });

app.get('/',function(req,res){
  res.render('index',{css_file:"/base.css"});
});
app.get('/home',function(req,res){
  res.render('home',{css_file:"/base.css"});
});

app.get('/register',function(req,res){
  res.render('register',{css_file:"/base.css"});
});
app.get('/login',function(req,res){
  res.render('login',{css_file:"/base.css"});
});

app.listen(3000);
