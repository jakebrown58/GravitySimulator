var app = {};

app.init = function () {
  app.physics = new Physics();
  app.particles = [];
  app.mouse = { x: app.halfWidth, y: app.halfHeight };
  app.TRACE = false;
  app.DRAWSTATE = 1;
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

  if(document && document.getElementById) {
    var display = document.getElementById('display');
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