require('dotenv').config()
const kue = require('kue'),
  queue = kue.createQueue(/* {
    redis: process.env.REDIS_PORT
  } */);


module.exports = function (message){
  let job2 = queue.create('roll back', message).ttl(7000).save(function (err) {
    console.log("Processing payment")
  });
}