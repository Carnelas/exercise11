require("dotenv").config();
const http = require("http");
const saveMessage = require("../clients/saveMessage");
const rollBackQueue = require("./rollBackQueue");
const braker = require("../circuitBreaker");
const util = require("util");
const logger = require("../winston");

module.exports = function(message, done) {
  logger.info(message);
  const body = JSON.stringify(message);
  const idQuery = message.qId;

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
      return new Promise(function(resolve, reject) {
        let postReq = http.request(postOptions);

        postReq.on("response", postRes => {
          if (postRes.statusCode === 200) {
            saveMessage(
              {
                ...message,
                qId: message.qId,
                status: "OK"
              },
              () => {
                logger.info("Acepted");
              },
              idQuery
            );
            resolve("OK");
          } else {
            logger.error("Error while sending message");

            saveMessage(
              {
                ...message,
                qId: message.qId,
                status: "ERROR",
                payment: false
              },
              () => {
                rollBackQueue();
                logger.warn("Internal server error: SERVICE ERROR");
              },
              idQuery
            );
            reject("ERROR");
          }
        });
        postReq.setTimeout(1000);
        postReq.on("timeout", () => {
          logger.info("Timeout Exceeded!");
          postReq.abort();
          saveMessage(
            {
              ...message,
              qId: message.qId,
              status: "TIMEOUT"
            },
            () => {
              logger.warn("Internal server error: TIMEOUT");
            },
            idQuery
          );
          reject("TIMEOUT");
        });
        postReq.on("error", () => {});

        postReq.write(body);
        postReq.end();
      });
    }
    const circuit = braker.slaveCircuit(messageappCircuitBraker);
    circuit
      .exec(postOptions)
      .then(result => {
        logger.info(`result: ${result}`);
      })
      .catch(err => {
        logger.error(`${err}`);
      });
    done();
  } else {
    saveMessage(
      {
        ...message,
        qId: message.qId,
        status: "INSUFICIENT CREDIT"
      },
      () => {
        logger.info("Internal server error:INSUFICIENT CREDIT");
      },
      idQuery
    );
  }
};
