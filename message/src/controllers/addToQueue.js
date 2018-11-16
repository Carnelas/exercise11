require('dotenv').config()
const kue = require('kue'),
  queue = kue.createQueue({
    redis: process.env.REDIS_PORT
  });
const sendMessage = require('./sendMessage');
const uuidv4 = require('uuid/v4');
const savePendingMessage = require('./savePendingMessage');
const braker = require('../circuitBreaker');
const logger = require("../winston");
let blockQueue = false

module.exports = function (req, res) {
  let id = uuidv4();
  let messBody = req.body
  messBody.qId = id;
  messBody.status = "PENDING";
  messBody.payment = false;
  Promise.resolve(savePendingMessage(messBody))
    .then(saveMessage => {
      let job = queue.create('test message', messBody).ttl(7000).save(function (err) {
        if (!braker.isOpen()) {
          res.send(`Processing message with id ${id}`)
         } else if (blockQueue === true){
            res.send('the message is waiting')
        } else {
          res.send(`message id ${id} the requests may take a while`)
        }
      });
    })
}
queue.process("creditChecked", function (job, ctx, done) {
  if (braker.isOpen()) {
    ctx.pause(0, function (err) {
      logger.info("Worker is paused... ");
      setTimeout(function () {
        ctx.resume();
      }, 20000);
    });
  }
  sendMessage(job.data, done)
});

queue.on('job enqueue', function (id, type) {
  queue.inactiveCount(function (err, total) {
    if (total >= process.env.QUEUE_MAX) {
      blockQueue = true
      logger.info('the queue is locked')
    }
  });
}).on('job complete', function (id, result) {
  queue.inactiveCount(function (err, total) {
    if (total <= process.env.QUEUE_WORK) {
    blockQueue = false
    logger.info('the queue is open')
    }
  });
});