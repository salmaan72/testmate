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

  socket.on('create test', function (title, numques) {
    eventEmitter.emit('create test db', title, numques);
    socket.emit('save status change');
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
    eventEmitter.emit('submit test db', totalQues, all_answers, testName, email);
    console.log('test submitted');
  });

  //create test field
  socket.on('create test field', function (testName, email) {
    eventEmitter.emit('create test field db', testName, email);
  })

});// connection event closing scope 

/**********************************************************************************************/
/**********************************************************************************************/

// event emitter events (database operations)
eventEmitter.on('save question db', function (quesObj, testTitle) {
  testModel.findOne({ 'title': testTitle }, function (err, foundQues) {
    foundQues.questions.push(quesObj);
    foundQues.save();
  });
});

eventEmitter.on('create test db', function (title, numques) {
  let newTest = new testModel({
    title: title,
    numberOfQuestions: numques,
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
    console.log('hahahaaaaaaaaaaaaaaaaaa finally ');
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
            console.log(foundres.testsTaken[j]['questions'][u]['isCorrect']);
            correctQues++;
          }
        }
        wrongQues = totalQues-correctQues;
        console.log('correct', correctQues);
        console.log('wrong', wrongQues);
        foundres.testsTaken[j]['score'] = ((4 * correctQues) - (wrongQues + questionsLeft));
        let percentage = (correctQues / totalQues) * 100;
        foundres.testsTaken[j]['percentage'] = percentage + '%';

      }
    }

    foundres.save().then().catch(function (err) {
      console.log('err while saving', err);
    })

  });
});

