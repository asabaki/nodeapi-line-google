const passport = require('passport');
const controller = require('../controllers/SCG');
const keys = require('../config/keys');
const line = require('@line/bot-sdk');
const config = {
    channelAccessToken: keys.channelAccessToken,
    channelSecret: keys.channelSecret
};
const client = new line.Client(config);

module.exports = app => {

    app.get('/', (req,res) => {
        res.json('So far so good');
    });

    app.get('/scg', controller.SCG);

    app.get('/xyz', controller.XYZ);

    app.get('/restaurant', controller.restaurant_find);

    app.post('/echo', line.middleware(config), controller.echo);

};
