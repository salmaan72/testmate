"use strict"

const express = require('express');
const routes = express();

const userController = require('./controllers/user.controller');
const verifyToken = require('./libs/verifyToken');
const splitCookies = require('./libs/splitCookies');
const dashboardController = require('./controllers/dashboard.controller');
const testPortal = require('./controllers/testPortal.controller');

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

// side-nav-buttons-clicked-routes ***********************************************************
routes.get('/tests-taken', function(req,res){
  res.render('testsTaken');
});
routes.get('/profile', function(req,res){
  res.render('profile');
});
routes.get('/tests-available', dashboardController.availableTests);

// test taking route
routes.post('/test-portal', testPortal.startTest);

// redirects
routes.post('/signup-success', function(req,res){
  res.render('signupSuccess');
});

//******************************** Admin routes ***********************************//

// control panel
routes.get('/admin/controlpanel', function(req,res){
  let token = splitCookies.cookieSplit(req.headers.cookie).token;
  verifyToken.verifyUserToken(token,res,function(authData){
    if(authData.user === 'admin@testmate.com'){
      res.render('cpanel');
    }
    else{
      res.send('not admin');
    }   
  }); 
});

// create a test
routes.get('/admin/create-test', function(req,res){
  let token = splitCookies.cookieSplit(req.headers.cookie).token;
  verifyToken.verifyUserToken(token,res,function(authData){
    if(authData.user === 'admin@testmate.com'){
      res.render('createTest');
    }
    else{
      res.send('not admin');
    }
  });
});

module.exports = routes;
