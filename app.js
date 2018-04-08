"use strict"

const express = require('express');
const app = express();
const routes = require('./routes');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const morgan = require('morgan');

const http = require('http').Server(app);
const io = require('socket.io')(http);

const events = require('events');
const eventEmitter = new events.EventEmitter();

// test model
let testModel = require('./models/test.model');

mongoose.connect('mongodb://localhost/testmate', function(){
  console.log('mongodb connected on default port');
});

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine','ejs');
app.set('views', path.join(__dirname+'/views'));

app.use('/', routes);

http.listen(3000, function(){
  console.log('server listening on port 3000');
});

// socket events
io.sockets.on('connection', function(socket){
  socket.on('save question', function(question, testTitle){
    eventEmitter.emit('save question db', question, testTitle);
  });

  socket.on('create test', function(title, numques){
    eventEmitter.emit('create test db', title, numques);
    socket.emit('save status change');
  });

});// connection event closing scope 

// event emitter events (database operations)
eventEmitter.on('save question db', function(quesObj, testTitle){
  testModel.findOne({'title': testTitle}, function(err, foundQues){
    //foundQues.questions.
    //foundQues.save();
  });
  
});

eventEmitter.on('create test db', function(title, numques){
  let newTest = new testModel({
    title: title,
    numberOfQuestions: numques,
    questions: []
  });
  newTest.save();
});
