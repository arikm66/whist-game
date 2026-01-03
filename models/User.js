const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, sparse: true },
    password: { type: String },
    googleId: { type: String, unique: true, sparse: true },
    facebookId: { type: String, unique: true, sparse: true },
    displayName: String,
    avatar: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema, 'users');
