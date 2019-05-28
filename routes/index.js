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

    app.post('/webhook', controller.webhook);

    app.post('/callback', line.middleware(config), (req,res) => {
        Promise
            .all(req.body.events.map(handleEvent))
            .then((result) =>
            {
                console.log('result: ');
                console.log(result);
                res.json(result)
            })
            .catch((err) => {
                console.error(err);
                res.status(500).end();
            });
    });

    function handleEvent(event) {
        if (event.type !== 'message' || event.message.type !== 'text') {
            // ignore non-text-message event
            return Promise.resolve(null);
        }

        // create a echoing text message
        const echo = { type: 'text', text: event.message.text };

        // use reply API
        return client.replyMessage(event.replyToken, echo);
    }


};
