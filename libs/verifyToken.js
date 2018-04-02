"use strict"

const jwt = require('jsonwebtoken');
const config = require('./config');

let verifyToken = {};

// (JWT) token verification
verifyToken.verifyUserToken = function(token,res,callback){
  if(token !== undefined && token !== null){
    //let token = cookie.split('=');
    let data = jwt.verify(token, config.secret, function(err,authData){
      if(err){
        res.sendStatus(403);
      }
      else{
        return authData;
      }
    });
    callback(data);
  }
  else{
    throw Error('Access denied. Please login to continue');
  }
}

module.exports = verifyToken;