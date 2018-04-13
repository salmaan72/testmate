"use strict"

const mongoose = require('mongoose');

const Schema = mongoose.Schema;



let questionSchema = new Schema({
    question: String,
    questionNumber: String,
    userAnswer: String,
    originalAnswer: String,
    isCorrect: Boolean
});

let testsTakenSchema = new Schema({
    testName: String,
    questions: [questionSchema],   
    totalQuestionsAttempted: Number,
    score: Number,
    percentage: String
    
});

let resultSchema = new Schema({
    userEmail: String,
    testsTaken: [testsTakenSchema],
});

const resultModel = mongoose.model('result_model', resultSchema);

module.exports = resultModel;
