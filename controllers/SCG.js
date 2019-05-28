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
const client_main = new line.Client(config);

const { LineClient } = require('messaging-api-line');

// get accessToken and channelSecret from LINE developers website
const client = LineClient.connect({
    accessToken: keys.channelAccessToken,
    channelSecret: keys.channelSecret,
});



exports.SCG = (req, res, next) => {
    res.json({
        message: 'No Raining Today'
    })
};

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

exports.replyNow = (req,res,next) => {
    const token = req.body.events[0].replyToken;
    const msg = req.body.events[0].message.text;
    console.log(token);
    console.log(msg);
    client.reply(token, [{
        type: 'text',
        text: 'Hello yourself'
    }, {
        type: 'text',
        text: 'Fucker'
    }]);
    res.sendStatus(200);
};


exports.replyWithMid = (req,res,next) => {
    const token = req.body.events[0].replyToken;
    const msg = req.body.events[0].message.text;
    console.log(token);
    console.log(msg);
    client_main.replyMessage(token, 'Hello Yourself, Bitch!!')
        .then(() => {
        console.log('Sending....');
        res.statusCode(200);
    })
};

