const keys = require('../config/keys');

const request = require('request');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const Redis = require('ioredis');
const redisUrl = keys.redisUrl;
const redis = new Redis(redisUrl);

// const redis = require('redis');
const redis_client = redis.createClient(redisUrl);
const util = require('util');
redis_client.hget = util.promisify(redis_client.hget);

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

const {LineClient, Line} = require('messaging-api-line');

// get accessToken and channelSecret from LINE developers website
const client = LineClient.connect({
    accessToken: keys.channelAccessToken,
    channelSecret: keys.channelSecret,
});


exports.SCG = async (req, res, next) => {
    const lat = 17.970520953781532;
    const lng = 99.65409406377026;
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

    request(options, (err, response, body) => {
        res.json(JSON.parse(body));
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
    /* Check in Redis Cache if value is exist if not fetch and save cache*/
    const restaurants = await redis_client.hget('restaurant', 'Bang Sue',);
    if (restaurants) {
        console.log('From Cache!');
        const result = JSON.parse(restaurants);
        res.json(result)
    } else {
        /* Find Latitude and Longitude value of 'Bang sue District'*/
        googleMapsClient.geocode({
            address: 'Bang Sue'
        }, (err, result) => {
            const latLngObj = result.json.results[0].geometry.location;
            const latLng = latLngObj['lat'] + ',' + latLngObj['lng'];

            // Assign Lat and Long and use them to find restaurant nearby
            googleMapsClient.placesNearby({
                location: latLng,
                rankby: 'distance',
                type: 'restaurant'
            }, (err, result) => {
                /* Set Cache to redis*/
                redis_client.hset('restaurant', 'Bang Sue', JSON.stringify(result), 'EX', '10');
                res.json(result || err);
            });
        });
    }


};

exports.replyNow = async (req, res, next) => {
    const token = req.body.events[0].replyToken;
    const event = req.body.events[0];
    // Get user id from req
    const userId = event.source.userId;
    console.log('Type: ', event.message.type);
    console.log(event);
    // Check if user is exist
    const user = await User.findOne({line_id: userId});

    if (event.message.type === 'text') {
        client.replyCarouselTemplate(token, 'Forecast', [
            {
                thumbnailImageUrl: 'https://images.unsplash.com/photo-1545259742-b4fd8fea67e4?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1650&q=80',
                title: 'Weather Forecast',
                text: 'Air temperature forecast',
                actions: [
                    {
                        type: 'location',
                        label: 'Let\'s Forecast',
                    },
                ],
            },
            // {
            //     thumbnailImageUrl: 'https://images.unsplash.com/photo-1509803874385-db7c23652552?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1650&q=80',
            //     title: 'Cloud Coverage',
            //     text: 'Cloud Coverage Forecast',
            //     actions: [
            //         {
            //             type: 'location',
            //             label: 'Let\'s Forecast',
            //         },
            //     ],
            // },
            // {
            //     thumbnailImageUrl: 'https://images.unsplash.com/photo-1495584816685-4bdbf1b5057e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1567&q=80',
            //     title: 'Humidity',
            //     text: 'Humidity Forecast',
            //     actions: [
            //         {
            //             type: 'location',
            //             label: 'Let\'s Forecast',
            //             data: 'action=humid'
            //         }
            //     ],
            // },
        ]);
    } else {
        {
            if (user) {
                try {
                    const addLocation = await User.findOneAndUpdate({line_id: userId},
                        {
                            $push: {
                                location: event.message.address
                            }
                        });
                } catch (e) {
                    console.log(e);
                    res.sendStatus(400);
                }
            } else {
                try {
                    const userObj = new User({
                        line_id: userId,
                        location: event.message.address
                    });
                    const new_User = await userObj.save();
                } catch (e) {
                    console.log(e);
                    res.sendStatus(400);
                }
            }
            // Check Cache existence
            let climate,temp;
            const forecast_result = await redis_client.hget(JSON.stringify(event.source.userId),JSON.stringify(event.message.address));
            if (forecast_result) {
                console.log('Serving from Cache');
                const json_forecast = JSON.parse(forecast_result);
                climate = json_forecast.weather[0].main;
                temp = json_forecast.main.temp;
                replyLine_helper(climate,token,temp);

            } else {
                // Fetch forecast detail
                const lat = event.message.latitude;
                const lon = event.message.longitude;
                const options = {
                    url: `https://api.openweathermap.org/data/2.5/weather`,
                    qs: {
                        APPID: '50e72c3fdbf1a59902613f027a11a64c',
                        lon,
                        lat,
                        units: 'metric'
                    }
                };
                request(options, (err, response, body) => {
                    const body_json = JSON.parse(body);
                    redis_client.hset(event.source.userId,event.message.address,JSON.stringify(body_json), 'EX', 10);
                    climate = body_json.weather[0].main;
                    temp = body_json.main.temp;
                    replyLine_helper(climate,token,temp);

                });
            }


            // console.log(event)
        }
    }


    res.sendStatus(200);
};

exports.testCache = async (req, res, next) => {
    redis_client.del('restaurant');
    res.sendStatus(200);
};



function replyLine_helper (climate,token,temp) {
    if (climate === 'Thunderstorm') {
        client.reply(token, [
            Line.createImage({
                originalContentUrl: 'https://imgbbb.com/images/2019/05/28/thunder.jpg',
                previewImageUrl: 'https://imgbbb.com/images/2019/05/28/thunder.th.jpg'
            }),
            Line.createText(`\`Whoa, It seems that there is a thunderstorm out there. The temperature right now is ${temp} °C\``)
        ])
    }
    if (climate === 'Clouds') {
        client.reply(token, [
            Line.createImage({
                originalContentUrl: 'https://imgbbb.com/images/2019/05/28/cloudy.jpg',
                previewImageUrl: 'https://imgbbb.com/images/2019/05/28/cloudy.th.jpg'
            }),
            Line.createText(`Hmmm, Quite Cloudy today. The temperature right now is ${temp} °C`)
        ]);
    }
    if (climate === 'Drizzle') {
        client.reply(token, [
            Line.createImage({
                originalContentUrl: 'https://imgbbb.com/images/2019/05/28/drizzle.jpg',
                previewImageUrl: 'https://imgbbb.com/images/2019/05/28/drizzle.th.jpg'
            }),
            Line.createText(`Drizzling today huh? The temperature right now is ${temp} °C`)
        ]);
    }
    if (climate === 'Rain') {
        client.reply(token, [
            Line.createImage({
                originalContentUrl: 'https://imgbbb.com/images/2019/05/28/rain.jpg',
                previewImageUrl: 'https://imgbbb.com/images/2019/05/28/rain.th.jpg'
            }),
            Line.createText(`Don\'t get wet today ain\'t you?. The temperature right now is ${temp} °C`)
        ]);
    }
    if (climate === 'Snow') {
        client.reply(token, [
            Line.createImage({
                originalContentUrl: 'https://imgbbb.com/images/2019/05/28/snow.jpg',
                previewImageUrl: 'https://imgbbb.com/images/2019/05/28/snow.th.jpg'
            }),
            Line.createText(`Bruh It\'s cold out there. The temperature right now is ${temp} °C`)
        ]);
    }
    if (climate === 'Clear') {
        client.reply(token, [
            Line.createImage({
                originalContentUrl: 'https://imgbbb.com/images/2019/05/28/sunny.jpg',
                previewImageUrl: 'https://imgbbb.com/images/2019/05/28/sunny.th.jpg'
            }),
            Line.createText(`Yeah! very sunny today. The temperature right now is ${temp} °C`)
        ]);
    }
}
/*

 [ { type: 'postback',
replyToken: '70b5d6bb75cf4c848f36ff4126c4e6bb',
 source:{ userId: 'Ub2a382c3beb331da459b1426710681f6', type: 'user' },
timestamp: 1559060923971,
 postback: { data: 'action=buy&itemid=123' } } ]

 */
