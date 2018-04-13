"use strict"

const splitCookies = require('./../libs/splitCookies');
const verifyToken = require('./../libs/verifyToken');
const userModel = require('./../models/user.model');
const testModel = require('./../models/test.model');
const resultModel = require('./../models/result.model');

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

dashboardController.takenTests = function(req, res){
    let token = splitCookies.cookieSplit(req.headers.cookie).token;
    verifyToken.verifyUserToken(token, res, function(authData){
        resultModel.findOne({'userEmail':authData.user}, function(err, found){
            let resultArr = [];
            let subObj = {};
            let totalTests = found.testsTaken.length;
            for(let i=0;i<totalTests;i++){
                subObj['testName'] = found.testsTaken[i]['testName'];
                subObj['totalQuestionsAttempted'] = found.testsTaken[i]['totalQuestionsAttempted'];
                subObj['score'] = found.testsTaken[i]['score'];
                subObj['percentage'] = found.testsTaken[i]['percentage'];
                resultArr.push(subObj);
                subObj = {};
            }
            console.log(resultArr);
            res.render('testsTaken', {testsTakenArr: resultArr});
        });
    });
}

dashboardController.profile = function(req, res){
    let token = splitCookies.cookieSplit(req.headers.cookie).token;
    verifyToken.verifyUserToken(token, res, function(authData){
        let userObj = {};
        userModel.findOne({'email': authData.user}, function(err, foundUser){
            userObj['fullname'] = foundUser.firstname+' '+foundUser.lastname;
            userObj['email'] = foundUser.email;
            userObj['phone'] = foundUser.phone;
            userObj['about'] = foundUser.about;
            resultModel.findOne({'userEmail': authData.user}, function(err, foundres){
                if(foundres['testsTaken'].length === 0){
                    userObj['testsTaken'] = 0;
                    userObj['average'] = 0;
                    res.render('profile', { userDetails: userObj });
                }
                else {
                    userObj['testsTaken'] = foundres['testsTaken'].length;
                    let nofTestsTaken = foundres['testsTaken'].length;
                    let avg, temp=0;
                    for(let i=0;i<nofTestsTaken;i++){
                        avg = foundres['testsTaken'][i]['percentage'].split('%');
                        temp += Number(avg[0]);
                    }
                    let average = temp/nofTestsTaken;
                    userObj['average'] = average+'%'

                    res.render('profile', { userDetails: userObj });
                }
                
            });
        });
    });
}

dashboardController.settings = function(req,res){
    let token = splitCookies.cookieSplit(req.headers.cookie).token;
    verifyToken.verifyUserToken(token, res, function(authData){
        res.render('userSettings');
    });
}

module.exports = dashboardController;