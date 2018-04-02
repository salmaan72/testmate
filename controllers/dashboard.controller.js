"use strict"

const splitCookies = require('./../libs/splitCookies');
const verifyToken = require('./../libs/verifyToken');

let dashboardController = {};

dashboardController.dashboard = function(req,res){
    let token = splitCookies.cookieSplit(req.headers.cookie).token;
    verifyToken.verifyUserToken(token,res,function(authData){
        res.render('dashboard', {userData: authData.user});
    });
}

module.exports = dashboardController;