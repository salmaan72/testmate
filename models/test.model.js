const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const testSchema = new Schema({
    title: {
        type: String,
        unique: true
    },
    numberOfQuestions: Number,
    questions: [Object]
});

const testModel = mongoose.model('test_model', testSchema);

module.exports = testModel;