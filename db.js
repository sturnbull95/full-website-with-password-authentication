const mongoose = require('mongoose');
const URLSlugs = require('mongoose-url-slugs');
const passportLocalMongoose = require('passport-local-mongoose');
var bcrypt   = require('bcrypt-nodejs');

// schema tells mongoose the types that are allowed in a collection
var User = new mongoose.Schema({
    username: {type:String, unique:true},
    pwSalt: String,
    password: String
});
User.methods.generateHash = function(password) {
    let salt = bcrypt.genSaltSync(10);
    console.log(salt);
    return {salt:salt, hash: bcrypt.hashSync(password, salt, null)};
};

// checking if password is valid
User.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};
User.plugin(passportLocalMongoose);
mongoose.model('User', User);
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/hw06');
