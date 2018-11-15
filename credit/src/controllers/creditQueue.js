require('dotenv').config()
const kue = require('kue'),
  queue = kue.createQueue(/* {
    redis: process.env.REDIS_PORT
  } */);
const checkCredit = require('./checkCredit');
const rollBackCredit = require('./rollBackCredit');


queue.process("test message", function (job, done) {
  let mess = job.data
  Promise.resolve(checkCredit(job, done))
  .then ((resp) =>{
    if (resp === true){
      mess.payment = true
    } 
    let job = queue.create('creditChecked', mess).ttl(7000).save(function (err) {      
    })
    done()
  })
  .catch(err => console.log(err))
})

queue.on('job enqueue',function(id,type){
  console.log("enqueue to creditChecked",id,type)
})

queue.process("roll back", function (job, done) {
  rollBackCredit()
  done()
})