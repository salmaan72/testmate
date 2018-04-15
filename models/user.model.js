"use strict"

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  firstname: {
    type: String,
    required: true
  },
  lastname: {
    type: String
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  about: {
    type: String
  },
  education: {
    high_school: {
      school: String,
      from_year: String,
      to_year: String
    },
    highest_degree: {
      school: String,
      from_year: String,
      to_year: String
    }
  }
});

const userModel = mongoose.model('user_model', userSchema);

module.exports = userModel;
