var app = {};

app.init = function () {
  app.physics = new Physics();
  app.display = document.getElementById('display');
  app.ctx = display.getContext('2d');
  app.particles = [];
  app.width = display.width = window.innerWidth;
  app.height = display.height = window.innerHeight;
  app.size = (app.width + app.height) / 2;
  app.halfWidth = app.width * 0.5;
  app.halfHeight = app.height * 0.5;
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

  app.display.focus();
  app.viewPort = new ViewPort();
  app.response = new Response();

  var x = new Particles().buildInitialParticles();
  requestAnimationFrame(app.viewPort.frame);
};
