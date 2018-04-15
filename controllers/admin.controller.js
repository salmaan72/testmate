"use strict"

const adminModel = require('./../models/admin.model');
const jwt = require('jsonwebtoken');
const config = require('./../libs/config');
const verifyToken = require('./../libs/verifyToken');
const splitCookies = require('./../libs/splitCookies');
const resultModel = require('./../models/result.model'); 
const testModel = require('./../models/test.model');
const userModel = require('./../models/user.model');

let adminController = {};

adminController.login = function(req, res){
    if(config.adminId === req.body.adminId && config.adminKey === req.body.key){
      jwt.sign({admin: config.adminId}, config.secret2, function(err,token){
        if(err){
          res.send(err);
        }
        res.cookie('adminToken',token,{ httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
        
        res.redirect('/admin/controlpanel');
      });
    }
    else {
      res.send('wrong admin ID / key');
    }
}

adminController.logout = function(req,res){
  let token = splitCookies.cookieSplit(req.headers.cookie).adminToken;
  verifyToken.verifyAdminToken(token,res,function(authData){
    res.clearCookie('adminToken',{path:'/'});
    res.clearCookie('io',{path:'/'});
    res.redirect('/');
  });
}

adminController.deleteTest = function(req, res){
  testModel.findOne({'title': req.body.testName}).remove(function(){
    res.redirect('/admin/delete-test');
  });
}


module.exports = adminController;