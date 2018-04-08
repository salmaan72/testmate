"use strict"

const splitCookies = require('./../libs/splitCookies');
const verifyToken = require('./../libs/verifyToken');
const userModel = require('./../models/user.model');

let dashboardController = {};

dashboardController.dashboard = function(req,res){
    let token = splitCookies.cookieSplit(req.headers.cookie).token;
    verifyToken.verifyUserToken(token,res,function(authData){
        userModel.findOne({'email':authData.user}, function(err, user){
            console.log(user);
            if(err){
                console.log(err);
            }
            const data = {
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                phone: user.phone,
            };
            
            res.render('dashboard', {userData: data});
            
        });
        
       //res.render('dashboard', {userData: authData.user});
    });
}

module.exports = dashboardController;