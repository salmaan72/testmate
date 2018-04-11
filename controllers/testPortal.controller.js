"use strict"

const splitCookies = require('./../libs/splitCookies');
const verifyToken = require('./../libs/verifyToken');

const testModel = require('./../models/test.model');

let testPortal = {};

testPortal.startTest = function(req,res){
    let token = splitCookies.cookieSplit(req.headers.cookie).token;
    verifyToken.verifyUserToken(token, res, function(authData){
        testModel.findOne({ title: req.body.testName }, function(err, foundTest){
            let nofQues = foundTest.questions.length;
            res.render('testPortal', {testName: req.body.testName, numOfQues: nofQues});
        });
    });
}

module.exports = testPortal;