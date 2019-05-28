const keys = require('../config/keys');
const request = require('request');
// const fetch = require('node-fetch');
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
    const lat = 13.975851;
    const lng = 99.637320;
    const params = 'airTemperature';
    const now = Date.now();
    const options = {
        url: `https://api.openweathermap.org/data/2.5/weather`,
        qs: {
            APPID: '50e72c3fdbf1a59902613f027a11a64c',
            lon: lng,
            lat,
            units: 'metric'
        }
    };

    request(options, (err,response,body) => {
        res.json(JSON.parse(body));
    })
    // fetch(`https://api.stormglass.io/v1/weather/point?lat=${lat}&lng=${lng}&params=${params}`, {
    //     headers: {
    //         'Authorization': '97711870-8166-11e9-acc1-0242ac130004-97711960-8166-11e9-acc1-0242ac130004'
    //     }
    // }).then((response) => response.json()).then((jsonData) => {
    //     // Do something with response data.
    //     res.json(jsonData);
    // });
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
    console.log(req.body.events);
    const token = req.body.events[0].replyToken;
    const event = req.body.events[0];
    if (event.type === 'postback') {
        const action = event.postback.data;

    }
    if (event.type === 'location') {
        console.log(event)
    }
    client.replyCarouselTemplate(token, 'Forecast', [
        {
            thumbnailImageUrl: 'https://images.unsplash.com/photo-1545259742-b4fd8fea67e4?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1650&q=80',
            title: 'Air Temperature',
            text: 'Air temperature forecast',
            actions: [
                {
                    type: 'location',
                    label: 'Let\'s Forecast',
                },
            ],
        },
        {
            thumbnailImageUrl: 'https://images.unsplash.com/photo-1509803874385-db7c23652552?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1650&q=80',
            title: 'Cloud Coverage',
            text: 'Cloud Coverage Forecast',
            actions: [
                {
                    type: 'postback',
                    label: 'Let\'s Forecast',
                    data: 'action=cloud',
                },
            ],
        },
        {
            thumbnailImageUrl: 'https://images.unsplash.com/photo-1495584816685-4bdbf1b5057e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1567&q=80',
            title: 'Humidity',
            text: 'Humidity Forecast',
            actions: [
                {
                    type: 'postback',
                    label: 'Let\'s Forecast',
                    data: 'action=humid',
                },


            ],
        },
    ]);

    res.sendStatus(200);
};


/*

 [ { type: 'postback',
replyToken: '70b5d6bb75cf4c848f36ff4126c4e6bb',
 source:{ userId: 'Ub2a382c3beb331da459b1426710681f6', type: 'user' },
timestamp: 1559060923971,
 postback: { data: 'action=buy&itemid=123' } } ]

 */
