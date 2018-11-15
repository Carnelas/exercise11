const updateCreditTransaction = require('../transactions/updateCredit')
const logger = require("../winston");

module.exports = function decreaseCredit() {

  return updateCreditTransaction(
    {
      amount: { $gte: 1 }
    },
    {
      $inc: { amount: -1}
    },
    function(doc, error) {
      if (error) {
        return cb(undefined, error);
      } else if (doc == undefined) {
        let error = "Not enough credit";
        cb(undefined, error);
      } else {
        logger.info('added to queue')
      }
    }
  );
}