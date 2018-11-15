require('dotenv').config()
const http = require("http");
const saveMessage = require("../clients/saveMessage");
const rollBackQueue = require("./rollBackQueue");
const braker = require('../circuitBreaker');
const util = require("util");

module.exports = function (message, done) {
    console.log(message)
    const body = JSON.stringify(message);
    const idQuery = message.qId

    if (message.payment === true) {
      const postOptions = {
        host: process.env.MESSAGEAPP_HOST_LOCAL,
        port: process.env.MESSAGEAPP_PORT,
        path: "/message",
        method: "post",
        json: true,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body)
        }
      };

      function messageappCircuitBraker(postOptions) {
        return new Promise(function (resolve, reject) {

          let postReq = http.request(postOptions);

          postReq.on("response", postRes => {
            if (postRes.statusCode === 200) {
              saveMessage({
                  ...message,
                  qId: message.qId,
                  status: "OK"
                },
                () => {
                  console.log("Error in server response");
                }, idQuery
              )
              resolve("OK")
            } else {
              console.error("Error while sending message");

              saveMessage({
                  ...message,
                  qId: message.qId,
                  status: "ERROR",
                  payment: false
                },
                () => {
                  rollBackQueue()
                  console.log("Internal server error: SERVICE ERROR");
                }, idQuery
              )
              reject("ERROR")
            }
          });
          postReq.setTimeout(1000);
          postReq.on("timeout", () => {
            console.error("Timeout Exceeded!");
            postReq.abort();
            saveMessage({
                ...message,
                qId: message.qId,
                status: "TIMEOUT"
              },
              () => {
                console.log("Internal server error: TIMEOUT");
              }, idQuery
            )
            reject("TIMEOUT")
          });
          postReq.on("error", () => {});

          postReq.write(body);
          postReq.end();
        })
      }
      const circuit = braker.slaveCircuit(messageappCircuitBraker)
      circuit
        .exec(postOptions)
        .then(result => {
          console.log(`result: ${result}`);
        })
        .catch(err => {
          console.error(`${err}`);
        });
        done()
    } else {
      saveMessage({
          ...message,
          qId: message.qId,
          status: "INSUFICIENT CREDIT"
        },
        () => {
          console.log("Internal server error:INSUFICIENT CREDIT");
        }, idQuery
      )
    }
  }