const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const passport = require('passport');
const middleware = require('@line/bot-sdk').middleware;
const bodyParser = require('body-parser');
const keys = require('./config/keys');
const config = {
    channelAccessToken: keys.channelAccessToken,
    channelSecret: keys.channelSecret
};
const path = require('path');
const logger = require('morgan');
const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));


require('./models/user_line');
// require('./models/Blog');
// require('./services/passport');
// require('./services/cache');
mongoose.Promise = global.Promise;
mongoose.connect(keys.mongoUri, {useNewUrlParser: true, useCreateIndex: true,});


// app.use(middleware(config));
// app.use(bodyParser.json());
app.use(
    cookieSession({
        maxAge: 30 * 24 * 60 * 60 * 1000,
        keys: [keys.cookieKey]
    })
);
app.use(passport.initialize());
app.use(passport.session());
require('./routes/index')(app);

module.exports = app;
