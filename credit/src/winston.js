const { createLogger, format, transports } = require("winston");
const logger = createLogger({
  level: 'silly',
  format: format.combine(
    format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss"
    }),
    format.json()
  ),
  transports: [
    new transports.Console({
      level: "silly",
      format: format.combine(
        format.colorize(),
        format.printf(
          info => `${info.timestamp} ${info.level}: ${info.message}`
        )
      )
    }),
  ]
});
logger.info('Hello world');
logger.warn('Warning message');
logger.debug('Debugging info');

module.exports = logger;