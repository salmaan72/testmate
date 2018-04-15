"use strict"

const splitCookies = require('./../libs/splitCookies');
const verifyToken = require('./../libs/verifyToken');
const userModel = require('./../models/user.model');

let userSettings = {};

userSettings.settings = function(req,res){
    let token = splitCookies.cookieSplit(req.headers.cookie).token;
    verifyToken.verifyUserToken(token, res, function(authData){
        let userDetails = {};
        userModel.findOne({'email': authData.user}, function(err, foundUser){
            userDetails['firstname'] = foundUser.firstname;
            userDetails['lastname'] = foundUser.lastname;
            userDetails['email'] = foundUser.email;
            userDetails['phone'] = foundUser.phone;
            userDetails['about'] = foundUser.about;
            res.render('userSettings', {userData: userDetails});
        });
    });
}

module.exports = userSettings;