"use strict"

const jwt = require('jsonwebtoken');

const splitCookies = require('./../libs/splitCookies');
const verifyToken = require('./../libs/verifyToken');
const config = require('./../libs/config');
const userModel = require('./../models/user.model');

let userController = {};

userController.signup = function(req,res){
  let newUser = new userModel({
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    email: req.body.email,
    phone: req.body.phone,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword
  });
  newUser.save().then(function(){
    res.redirect('/signup-success');
  });
}

userController.login = function(req,res){
  userModel.findOne({ $and:[{'email':req.body.email}, {'password':req.body.password}] }, function(err,foundUser){
    if(err){
      res.send(err);
    }
    else if(foundUser === null || foundUser === undefined){
      res.send('wrong username/password');
    }
    else{
      jwt.sign({user: foundUser.email},config.secret,function(err,token){
        if(err){
          res.send(err);
        }
        let data = {
          name: foundUser.firstname+' '+foundUser.lastname
        }
        res.cookie('token',token,{ httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
        
        res.redirect('/dashboard');
      });
    }
  });
}

userController.logout = function(req,res){
  let token = splitCookies.cookieSplit(req.headers.cookie).token;
  verifyToken.verifyUserToken(token,res,function(authData){
    res.clearCookie('token',{path:'/'});
    res.clearCookie('io',{path:'/'});
    res.redirect('/');
  });
}

module.exports = userController;
