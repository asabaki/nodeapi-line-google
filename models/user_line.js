const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    line_id: String,
    displayName: String
});

mongoose.model('User', userSchema);
