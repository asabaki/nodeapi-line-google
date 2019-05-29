const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    line_id: String,
    location: [String]
});

mongoose.model('User', userSchema);
