var client = require('prom-client');
var gauge = new client.Gauge({name: 'Error_Gauge', help: 'Error_Gauge'});


setInterval(() => {
    gauge.set(0); // Set to 10
}, 1000);

function countError () {
    gauge.inc(1, new Date())
}
module.exports = countError;