var Prometheus = require('prom-client');  


module.exports = function(req, res) {
res.set('Content-Type', Prometheus.register.contentType)
res.end(Prometheus.register.metrics())
}
