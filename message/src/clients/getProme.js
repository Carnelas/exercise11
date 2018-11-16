var Prometheus = require('prom-client');  
var defaultMetrics = Prometheus.defaultMetrics;



module.exports = function(req, res) {
res.set('Content-Type', Prometheus.register.contentType)
res.end(Prometheus.register.metrics())
}

