"use strict"

const splitCookies = require('./../libs/splitCookies');
const verifyToken = require('./../libs/verifyToken');
const userModel = require('./../models/user.model');
const testModel = require('./../models/test.model');

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

dashboardController.availableTests = function(req,res){
    let token = splitCookies.cookieSplit(req.headers.cookie).token;
    verifyToken.verifyUserToken(token, res, function(authData){
        let query = testModel.find({}).select('title');
        query.exec(function(err, data){
            if(err){
                return err;
            }
            let count = data.length;
            res.render('testsAvailable', { testsTitles:data, numOfTests: count });
        });
    });
}

module.exports = dashboardController;