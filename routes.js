"use strict"

const express = require('express');
const routes = express();

const userController = require('./controllers/user.controller');
const verifyToken = require('./libs/verifyToken');
const splitCookies = require('./libs/splitCookies');
const dashboardController = require('./controllers/dashboard.controller');
const testPortal = require('./controllers/testPortal.controller');
const settingsController = require('./controllers/settings.controller');
const adminController = require('./controllers/admin.controller');
const testModel = require('./models/test.model');

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

routes.get('/dashboard/settings', settingsController.settings);

// side-nav-buttons-clicked-routes ***********************************************************
routes.get('/tests-taken', dashboardController.takenTests);
routes.get('/profile', dashboardController.profile);
routes.get('/tests-available', dashboardController.availableTests);

// test taking route
routes.post('/test-portal', testPortal.startTest);

// redirects
routes.post('/signup-success', function(req,res){
  res.render('signupSuccess');
});

// user settings route
routes.get('/dashboard/settings', dashboardController.settings);

//******************************** Admin routes ***********************************//
// admin login
routes.route('/admin/login').get(function(req, res){
  if(req.headers.cookie !== undefined){
    let cookieObj = splitCookies.cookieSplit(req.headers.cookie);
    if(cookieObj.adminToken === undefined){
      res.render('adminLogin');
    }
    else{
      res.redirect('/admin/controlpanel');
    }
  }
  else{
    res.render('adminLogin');
  }
}).post(adminController.login);

routes.post('/adminlogout', adminController.logout);

// control panel
routes.get('/admin/controlpanel', function(req,res){
  let token = splitCookies.cookieSplit(req.headers.cookie).adminToken;
  verifyToken.verifyAdminToken(token,res,function(authData){
    res.render('cpanel');  
  }); 
});

// create a test
routes.get('/admin/create-test', function(req,res){
  let token = splitCookies.cookieSplit(req.headers.cookie).adminToken;
  verifyToken.verifyAdminToken(token,res,function(authData){
    res.render('createTest');
  });
});
// delete a test
routes.route('/admin/delete-test').get(function(req,res){
  let token = splitCookies.cookieSplit(req.headers.cookie).adminToken;
  verifyToken.verifyAdminToken(token,res,function(authData){
    let query = testModel.find({}).select('title');
        query.exec(function(err, data){
            if(err){
                return err;
            }
            let count = data.length;
            res.render('deleteTest', { testsTitles:data, numOfTests: count });
        });
  });
}).post(adminController.deleteTest);

routes.get('/admin/users-info', adminController.usersInfo);

module.exports = routes;
