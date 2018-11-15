const logger = require("../winston");

module.exports = function(req, res) {
  res.status(200)
  .send('Version 1');
  logger.info('version 1')
};