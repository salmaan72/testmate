"use strict"

const express = require('express');
const app = express();
const routes = require('./routes');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/testmate', function(){
  console.log('mongodb connected on default port');
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine','ejs');
app.set('views', path.join(__dirname+'/views'));

app.use('/', routes);

app.listen(3000, function(){
  console.log('server listening on port 3000');
});
