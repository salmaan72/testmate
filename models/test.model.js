const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const questionSchema = new Schema({
    question: String,
    option_a: String,
    option_b: String,
    option_c: String,
    option_d: String,
    answer: String
});

const testSchema = new Schema({
    title: {
        type: String,
        unique: true
    },
    numberOfQuestions: Number,
    duration: Number,
    questions: [questionSchema]
});

const testModel = mongoose.model('test_model', testSchema);

module.exports = testModel;