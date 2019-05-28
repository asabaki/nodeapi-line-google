const keys = require('../config/keys');
const request = require('request')
const googleMapsClient = require('@google/maps').createClient({
    key: keys.googleApi,
    Promise: Promise
});
const line = require('@line/bot-sdk');
const config = {
    channelAccessToken: keys.channelAccessToken,
    channelSecret: keys.channelSecret
};
const client = new line.Client(config);



exports.SCG = (req, res, next) => {
    res.json({
        message: 'No Raining Today'
    })
};
// TODO - Add npm request and study architecture of LINE Api again
exports.XYZ = (req, res, next) => {
    /*
    ------ Write a function to find X,Y,Z from series 3,5,9,15,X,Y,Z -----
    Obviously, we can see the difference of 1st term and 2nd term is 2
    2nd and 3rd term is 4
    3rd and 4th term is 6
    It means that given first term we can find next term from formula
    T(i) = 2*i + T(i-1) where i is term

    The problem is to find X Y and Z which is lied on 5th 6th and 7th term
    */
    const findXYZ = function () {
        const series = [3];
        for (let i = 1; i < 7; i++) {
            const Ti = 2 * i + series[i - 1];
            series.push(Ti);
        }
        /* Cut it and return only X Y and Z */
        return series.splice(4);
    };
    res.json({
        X: findXYZ()[0],
        Y: findXYZ()[1],
        Z: findXYZ()[2],
    })
};

exports.restaurant_find = async (req, res, next) => {
    /*
    Find Latitude and Longitude value of 'Bang sue District'
    */
    googleMapsClient.geocode({
        address: 'Bang Sue'
    }, (err, result) => {
        const latLngObj = result.json.results[0].geometry.location;
        const latLng = latLngObj['lat'] +','+ latLngObj['lng'];

        // Assign Lat and Long and use them to find restaurant nearby
        googleMapsClient.placesNearby({
            location: latLng,
            rankby: 'distance',
            type: 'restaurant'
        }, (err, result) => {
            res.json(result || err);
        });
    });

};

exports.webhook = (req,res,next) => {
    let reply_token = req.body.events[0].replyToken;
    let msg = req.body.events[0].message.text;
    reply(reply_token, msg);
    res.sendStatus(200)
};

function reply(reply_token, msg) {
    let headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer {xxxxxxx}'
    };
    let body = JSON.stringify({
        replyToken: reply_token,
        messages: [{
            type: 'text',
            text: msg
        }]
    });
    request.post({
        url: 'https://api.line.me/v2/bot/message/reply',
        headers: headers,
        body: body
    }, (err, res, body) => {
        console.log('status = ' + res.statusCode);
    });
}

// exports.echo = (req,res,next) => {
//     Promise
//         .all(req.body.events.map(handleEvent))
//         .then((result) => res.json(result))
//         .catch((err) => {
//             console.error(err);
//             res.status(500).end();
//         });
// };
//
// function handleEvent(event) {
//     if (event.type !== 'message' || event.message.type !== 'text') {
//         // ignore non-text-message event
//         return Promise.resolve(null);
//     }
//
//     // create a echoing text message
//     const echo = { type: 'text', text: event.message.text };
//
//     // use reply API
//     return client.replyMessage(event.replyToken, echo);
// }
