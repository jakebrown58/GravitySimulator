var app = {};

// var Physics = require('./physics');
// var Thrust = require('./thrust');
// var ViewPort = require('./viewport');
// var Reponse = require('./response');
// var Particles = require('./particles');

var Physics;
var Thrust;
var ViewPort;
var Feedback;
var Particles;


function TextParser() { 
}

TextParser.prototype.handleConsole = function() {
};

app.TextParser = TextParser;

app.init = function (deps) {
  Physics = deps.Physics;
  Thrust = deps.Thrust;
  ViewPort = deps.ViewPort;
  Feedback = deps.Feedback;
  Particles = deps.Particles;
  app.physics = new Physics();
  app.particles = [];
  app.mouse = { x: app.halfWidth, y: app.halfHeight };
  app.TRACE = false;
  app.VIEWSHIFT = {x: -50, y: 0, z: 0, zoom: 0};
  app.GO = true;
  app.FOLLOW = 0;
  app.CLOCK = {ticks: 0};
  app.SHOWCLOCK = false;
  app.realTime = Date();
  app.splitTime = Date();
  app.closestPair = {x: 0, y: 0, z: 0, d: 0};
  app.eventListener = {};
  app.collisions = 0;
  app.COLLISION_IMMENENCE_RANGE = 0.1;
  app.potentialCollisions = app.resetPotentialCollisions();
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

    var console = document.getElementById('console');
    app.console = console;
    app.console.width = app.width * 0.2;
    app.console.height = app.height;
    app.console.style.visibility = "hidden";

    app.console.ctx = console.getContext('2d');
  } else {
    app.ctx = new mockCtx();
    app.width = 100;
    app.height = 100;
    app.halfWidth = app.width * 0.5;
    app.halfHeight = app.height * 0.5;
  }

  window.addEventListener("resize", function() { 
    app.width = display.width = window.innerWidth - 40;
    app.height = display.height = window.innerHeight - 30;
    app.halfWidth = app.width * 0.5;
    app.halfHeight = app.height * 0.5;
    app.size = (app.width + app.height) / 2;
  }); 

  app.size = (app.width + app.height) / 2;

  app.viewPort = new ViewPort(app);
  app.response = new Feedback(app);

  var x = new Particles(app).buildInitialParticles();
  requestAnimationFrame(app.viewPort.frame);
};

app.toggleConsoleVisibility = function(makeVisible) {
  var consoleScale = 0.2;

  if (makeVisible) {
    app.console.style.visibility = "visible";
    app.display.width = app.width * 0.8;
  } else {
    app.console.style.visibility = "hidden";
    app.display.width = app.width;
  }
};

app.resetPotentialCollisions = function() {
  app.potentialCollisions = { "0": [], "1": [], "5": [], "10": [], "50": [], "100": [] };
};

app.flattenPotentialCollisions = function() {
  var flat = [],
    n,
    list,
    pair,
    big,
    little;

  for (var bucket in app.potentialCollisions) {
    n = Number(bucket);
    list = app.potentialCollisions[n / 100];
    if (list && list.length)
      for (pair in list) {
        big = app.particles[list[pair][0]];
        little = app.particles[list[pair][1]];
        flat.push({big: big, little: little});
      }
  }

  return flat;
};

app.clockReset = function() {
  app.CLOCK.ticks = 0;
  app.splitTime = new Date();
};

//module.exports = app;