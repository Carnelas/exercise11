require('dotenv').config()
const logger = require("../winston");
const kue = require('kue'),
  queue = kue.createQueue(/* {
    redis: process.env.REDIS_PORT
  } */);


module.exports = function (message){
  let job2 = queue.create('roll back', message).ttl(7000).save(function (err) {
    logger.info("Processing payment")
  });
}