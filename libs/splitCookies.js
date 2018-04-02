"use strict"

exports.cookieSplit = function(cookie){
  //let index;
  if(cookie !== undefined && cookie !== null){
    let cookieObj = {};
    let trimCookie = [];
    let temp;
    let arrCookie = cookie.split(';');
    for(let index in arrCookie){
      trimCookie.push(arrCookie[index].trim());
    }
    for(let index in trimCookie){
      temp = trimCookie[index].split('=');
      cookieObj[temp[0]] = temp[1];
    }
    return cookieObj;
  }
  else{
    throw Error('Access denied. Please login to continue');
  }
}
