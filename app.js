"use strict"

const express = require('express');
const app = express();
const routes = require('./routes');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const morgan = require('morgan');
const async = require('async');

const http = require('http').Server(app);
const io = require('socket.io')(http);

const events = require('events');
const eventEmitter = new events.EventEmitter();

// models
let testModel = require('./models/test.model');
let userModel = require('./models/user.model');
let resultModel = require('./models/result.model');
let adminModel = require('./models/admin.model');
let config = require('./libs/config');

mongoose.connect('mongodb://localhost/testmate', function () {
  console.log('mongodb connected on default port');
});

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname + '/views'));

app.use('/', routes);

http.listen(3000, function () {
  console.log('server listening on port 3000');
});


// socket events
io.sockets.on('connection', function (socket) {
  socket.on('save question', function (question, testTitle) {
    eventEmitter.emit('save question db', question, testTitle);
  });
  eventEmitter.on('ack 1', function(){
    socket.emit('ques saved ack');
  })

  socket.on('create test', function (title, numques, duration) {
    eventEmitter.emit('create test db', title, numques, duration);
  });

  //test portal sockets
  socket.on('get question', function (testName) {
    let ques = [];
    let temp;
    async.series([function (callback) {
      testModel.findOne({ 'title': testName.trim() }, function (err, found) {
        let numOfQues = found.questions.length;

        for (let i = 0; i < numOfQues; i++) {
          temp = found.questions[i];
          delete temp.answer;
          ques.push(temp);
        }
        callback(null, 'one');
      });
    }, function (callback) {
      socket.emit('returned questions', ques, testName);
      callback(null, 'two');
    }]);
  });

  //submitting test
  socket.on('submit test', function (totalQues, all_answers, testName, email) {
    console.log('subm time');
    eventEmitter.emit('submit test db', totalQues, all_answers, testName, email);
    console.log('test submitted');
  });

  //create test field
  socket.on('create test field', function (testName, email) {
    eventEmitter.emit('create test field db', testName, email);
  });

  //user settings events
  socket.on('save personal info', function(editedInfo, email){
    eventEmitter.emit('save personal info db', editedInfo, email);
    
  });
  //check password
  socket.on('check password', function(passInfo, email){
    eventEmitter.emit('check password db', passInfo, email);
  });
  eventEmitter.on('ack 2', function(status){
    socket.emit('pass ack', status);
  });
  
});// connection event closing scope 

/**********************************************************************************************/
/**********************************************************************************************/

// event emitter events (database operations)
eventEmitter.on('save question db', function (quesObj, testTitle) {
  testModel.findOne({ 'title': testTitle }, function (err, foundQues) {
    foundQues.questions.push(quesObj);
    foundQues.save();
    eventEmitter.emit('ack 1');
  });
});

eventEmitter.on('create test db', function (title, numques, duration) {
  let newTest = new testModel({
    title: title,
    numberOfQuestions: numques,
    duration: Number(duration),
    questions: []
  });
  newTest.save();

});

// create test in db
eventEmitter.on('create test field db', function (testName, email) {
  resultModel.findOne({ 'userEmail': email }, function (err, found) {
    for (let i in found.testsTaken) {
      if (found.testsTaken[i]['testName'] === testName.trim()) {
        return;
      }
    }
    found.testsTaken.push({
      testName: testName.trim(),
      questions: [],
      totalQuestionsAttempted: 0,
      score: 0,
      percentage: '0%'
    });
    found.save();
  })
});

//submit test
eventEmitter.on('submit test db', function (totalQues, all_answers, testName, email) {
  //console.log(all_answers);
let hflag = false;
  testModel.findOne({ 'title': testName.trim() }, function (err, foundTest) {
    //console.log(foundTest);
    for (let p in all_answers) {
      for (let t in foundTest['questions']) {
        if (all_answers[p]['questionText'] === foundTest.questions[t]['question']) {
          all_answers[p]['originalAnswer'] = foundTest.questions[t]['answer'];
        }
      }
    }
    for (let q in all_answers) {
      if (all_answers[q]['choice'] === all_answers[q]['originalAnswer']) {
        all_answers[q]['isCorrect'] = true;
      }
      else {
        all_answers[q]['isCorrect'] = false;
      }
    }
    //console.log(all_answers);
    for (let r in all_answers) {
      if(!hflag){
      let finalObj = {};
      finalObj['question'] = all_answers[r]['questionText'];
      finalObj['questionNumber'] = all_answers[r]['questionNum'];
      finalObj['userAnswer'] = all_answers[r]['choice'];
      finalObj['originalAnswer'] = all_answers[r]['originalAnswer'];
      finalObj['isCorrect'] = all_answers[r]['isCorrect'];
      console.log(finalObj);
      resultModel.findOne({ 'userEmail': email }, function (err, found) {
        for (let j in found.testsTaken) {
          if (found.testsTaken[j]['testName'] === testName.trim()) {
            //console.log(found.testsTaken[j]);
            found.testsTaken[j]['questions'].push(finalObj);
            found.save().then(function(data){
              eventEmitter.emit('part 2', email, testName, totalQues);
            }).catch(function(err){
              console.log('error occured', err);
            });
            hflag = true;
          }
        }
        
      });
    }
    }    
  });
});


eventEmitter.on('part 2', function(email, testName, totalQues){
  resultModel.findOne({ 'userEmail': email }, function (err, foundres) {
    let correctQues = 0;
    let wrongQues = 0;
    let totalQuesAttempted;
    let questionsLeft;
    for (let j in foundres.testsTaken) {
      if (foundres.testsTaken[j]['testName'] === testName.trim()) {
        foundres.testsTaken[j]['totalQuestionsAttempted'] = foundres.testsTaken[j]['questions'].length;
        totalQuesAttempted = foundres.testsTaken[j]['questions'].length;
        questionsLeft = totalQues - totalQuesAttempted;

        for (let u in foundres.testsTaken[j]['questions']) {
          if (foundres.testsTaken[j]['questions'][u]['isCorrect'] === true) {
            //console.log(foundres.testsTaken[j]['questions'][u]['isCorrect']);
            correctQues++;
          }
        }
        wrongQues = totalQues-correctQues;
        //console.log('correct', correctQues);
        //console.log('wrong', wrongQues);
        foundres.testsTaken[j]['score'] = ((4 * correctQues) - (wrongQues + questionsLeft));
        let percentage;
        if(totalQues !== 0){
          percentage = (correctQues / totalQues) * 100;
        }else{
          percentage=0;
        }
        foundres.testsTaken[j]['percentage'] = percentage+'%';

      }
    }

    foundres.save().then().catch(function (err) {
      console.log('err while saving', err);
    });

  });
});

// save edited personal info in db
eventEmitter.on('save personal info db', function(editedInfo, email){
  userModel.findOne({'email': email}, function(err, found){
    if(editedInfo['firstname'] !== found['firstname']){
      found['firstname'] = editedInfo['firstname'];
    }
    if(editedInfo['lastname'] !== found['lastname']){
      found['lastname'] = editedInfo['lastname'];
    }
    if(editedInfo['email'] !== found['email']){
      found['email'] = editedInfo['email'];
    }
    if(editedInfo['phone'] !== found['phone']){
      found['phone'] = editedInfo['phone'];
    }
    if(editedInfo['about'] !== found['about']){
      found['about'] = editedInfo['about'];
    }
    found.save().then().catch(function (err) {
      console.log('err while saving', err);
    });
  });
});

//check for password in db
eventEmitter.on('check password db', function(passInfo, email){
  userModel.findOne({'email':email}, function(err, found){
    if(found.password === passInfo['currentpass']){
      found.password = passInfo['newpass'];
      found.save();
      eventEmitter.emit('ack 2', true);
    }
    else {
      eventEmitter.emit('ack 2', false);
    }
  });
}); 
