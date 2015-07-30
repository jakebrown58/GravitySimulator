var app = {};

app.init = function () {
  app.physics = new Physics();
  app.particles = [];
  app.mouse = { x: app.halfWidth, y: app.halfHeight };
  app.TRACE = false;
  app.DRAWSTATE = 4;
  app.VIEWSHIFT = {x: -50, y: 0, zoom: 0};
  app.GO = true;
  app.VIEWANGLE = .75;
  app.FOLLOW = 0;
  app.CLOCK = {j: 0, e: 0, n: 0, ticks: 0};
  app.SHOWCLOCK = false;
  app.realTime = Date();
  app.splitTime = Date();
  app.closestPair = {x: 0, y: 0, d: 0};
  app.eventListener = {};
  app.collissions = 0;
  app.thrust = new Thrust();

  if(document && document.getElementById) {
    var display = document.getElementById('display');
    app.display = display;
    app.width = display.width = window.innerWidth - 40;
    app.height = display.height = window.innerHeight - 30;
    app.halfWidth = app.width * 0.5;
    app.halfHeight = app.height * 0.5;
    app.ctx = display.getContext('2d');
    display.focus();
    app.eventListener = display;
  } else {
    app.ctx = new mockCtx();
    app.width = 100;
    app.height = 100;
    app.halfWidth = app.width * 0.5;
    app.halfHeight = app.height * 0.5;
  }

  app.size = (app.width + app.height) / 2;

  app.viewPort = new ViewPort();
  app.response = new Response();

  var x = new Particles().buildInitialParticles();
  requestAnimationFrame(app.viewPort.frame);
};


var mockCtx = function() {

  this.fillText = function() {
    return 0;
  }

  this.beginPath = function() {
    return 0;
  }

  this.fill = function() {
    return 0;
  }

  this.arc = function() {
    return 0;
  }

  this.clearRect = function() {
    return 0;
  }
}


function Thrust() {
  this.heading = 0;
  this.thrust = 0;
  this.burning = false;
}

Thrust.prototype.act = function(action) {
  var me = this;
  if(action === 'rocketEnginesBurnToggle') { me.toggleBurn(); }
  if(action === 'rocketRotateLeft') { me.updateHeading(-2); }
  if(action === 'rocketRotateRight') { me.updateHeading(2); }
  if(action === 'rocketIncreaseThrust') { me.updateThrust(1); }
}

Thrust.prototype.updateHeading = function(headingAdjustment) {
  this.heading += headingAdjustment;

  if(this.heading > 360) {
    this.heading = 0;
  }
  if(this.heading < 0) {
    this.heading = 360;
  }
}

Thrust.prototype.getThrustVector = function() {
  if(!this.burning) {
    return {x: 0, y:0};
  }


  return { 
    x: this.thrust * Math.cos(Math.PI * this.heading / 180),
    y: this.thrust * Math.sin(Math.PI * this.heading / 180)
  };
}

Thrust.prototype.updateThrust = function(thrustAdjustment) {
  this.thrust += thrustAdjustment;
}

Thrust.prototype.toggleBurn = function() {
  this.burning = !this.burning;

  if(!this.burning) {
    this.thrust= 0;
  }
}