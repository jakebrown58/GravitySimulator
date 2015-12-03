//var app = require('./app');

var Physics = require('./physics');
var Thrust = require('./thrust');
var ViewPort = require('./viewport');
var Feedback = require('./feedback');
var Particles = require('./particles');

var deps = {
	Physics: Physics,
	Thrust: Thrust,
	ViewPort: ViewPort,
	Feedback: Feedback,
	Particles: Particles
};

app.init(deps);
