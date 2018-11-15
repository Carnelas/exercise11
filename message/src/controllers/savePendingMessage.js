const saveMessage = require('../clients/saveMessage');
const logger = require("../winston");

module.exports = (message) => saveMessage({
  ...message,
  qId : message.qId,
  status : 'PENDING'
},
() => {
  logger.error("Error saving PENDING message");
}
)