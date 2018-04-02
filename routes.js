"use strict"

const express = require('express');
const routes = express();

const userController = require('./controllers/user.controller');
const verifyToken = require('./libs/verifyToken');
const splitCookies = require('./libs/splitCookies');
const dashboardController = require('./controllers/dashboard.controller');

routes.get('/', function(req,res){
  res.render('home');
});

routes.route('/login').get(function(req,res){
  if(req.headers.cookie !== undefined){
    let cookieObj = splitCookies.cookieSplit(req.headers.cookie);
    if(cookieObj.token === undefined){
      res.render('login')
    }
    else{
      res.redirect('/dashboard');
    }
  }
  else{
    res.render('login');
  }
}).post(userController.login);

routes.route('/signup').get(function(req,res){
  res.render('signup');
}).post(userController.signup);

routes.get('/dashboard', dashboardController.dashboard);

routes.post('/logout', userController.logout);

// redirects
routes.get('/signup-success', function(req,res){
  res.render('signupSuccess');
})

module.exports = routes;
