(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* ******************* RESPONSE ******************************************************* */
var keyMap = {
  // reference: https://css-tricks.com/snippets/javascript/javascript-keycodes/
  // also, difference between keyCode and charCode:
  // http://stackoverflow.com/questions/1772179/get-character-value-from-keycode-in-javascript-then-trim
  86: 'viewToggle', // v
  32: 'trace',  // '<space>'
  82: 'reset', // 'R'
  84: 'reverseTime', // 'T'
  87: 'viewShiftUp', // 'W'
  83: 'viewShiftDown', // 'S'
  65: 'viewShiftLeft', // 'A'
  68: 'viewShiftRight', // 'D'
  77: 'switchClickAction', // 'M'
  80: 'pause', // 'P'
  67: 'visualLogging', // 'C'
  70: 'follow', // 'F'
  88: 'speedItUp', // 'X'
  90: 'slowItDown', // 'Z'
  192: 'toggleCommandMode', // '` or ~'
  188: 'zoomOut', // '<'
  190: 'zoomIn', // '>'
  72: 'switchToDefaultView', // 'H'
  66: 'rocketEnginesBurnToggle', // 'B'
  37: 'rocketRotateLeft', // 'LEFT'
  39: 'rocketRotateRight', // 'RIGHT'
  38: 'rocketIncreaseThrust', // 'UP'
};

function Feedback(app) {
  app.eventListener.addEventListener('mousemove', this.onMousemove);
  app.eventListener.addEventListener('click', this.onClickSplash);
  app.eventListener.addEventListener('keydown', this.onKeyDown);
  app.eventListener.addEventListener('mousewheel', this.onMouseWheel);

  this.MODE = 'FOLLOW';
  this.CommandMode = 'COMMAND';
  app.textParser = new TextParser();

  this.commands = [
    {command: "cprop", description: "change any property on any object to any value (power tool)", fn: this.changeProperty},
    {command: "addp", description: "add a single planet", fn: this.addParticle},
    {command: "addc", description: "add a bunch of planets", fn: this.addCloud},
    {command: "destall", description: "remove everything", fn: this.destroyAll}
    ];
}

Feedback.prototype.onKeyDown = function(e, ref) {
  app.response.eventHandle = this.onKeyDown;
  if(app.response.CommandMode === 'COMMAND') {
    app.response.handleCommand(e);
  } else {
    //app.response.handleConsole(e);
  }

  return false;
};


Feedback.prototype.onClickSplash = function(e){
  if (app.viewPort.drawState !== app.viewPort.DRAW_STATE_SPLASH){
    app.eventListener.removeEventListener('click', app.response.onClickSplash);
    app.eventListener.addEventListener('click', app.response.onClick);
    app.response.onClick(e);
  }
};


Feedback.prototype.onClick = function(e) {
  var xy = {x: e.clientX, y: e.clientY};

  if(app.response.MODE === 'FOLLOW') {
    app.response.follow(xy);
  } else if(app.response.MODE === 'DESTROY') {
    app.response.destroy(xy);
  } else {
    app.response.rocket();
  }
};

Feedback.prototype.onMousemove = function(e) {
  if (app.viewPort.drawState == app.viewPort.DRAW_STATE_ROTATE){
    app.viewPort.reorient(app.mouse, {x: e.clientX, y: e.clientY});
  }
  app.mouse.x = e.clientX;
  app.mouse.y = e.clientY;
};

Feedback.prototype.onMouseWheel = function(e){
  e.preventDefault();
  if (e.deltaY > 0){
    app.viewPort.adjustZoom('out');
  }else{
    app.viewPort.adjustZoom('in');
  }
  return false;
};

Feedback.prototype.handleCommand = function(e) {
  var action = keyMap[e.keyCode];
  if(action === 'toggleCommandMode') { app.response.switchCommandMode(); return;}
  if(action === 'zoomOut') { app.viewPort.adjustZoom('out'); }
  if(action === 'zoomIn') { app.viewPort.adjustZoom('in'); }  
  if(action === 'switchToDefaultView')  { app.response.resetViewToHome(); }
  if(action === 'rocketEnginesBurnToggle') { app.thrust.act(action); }
  if(action === 'rocketRotateLeft') { app.thrust.act(action); }
  if(action === 'rocketRotateRight') { app.thrust.act(action); }
  if(action === 'rocketIncreaseThrust') { app.thrust.act(action); }
  if(action === 'viewToggle') { app.response.changeView(); }
  if(action === 'trace') { app.TRACE = !app.TRACE; }
  if(action === 'reset') { app.response.reset(); }
  if(action === 'reverseTime') { app.physics.reverseTime(); } 
  if(action === 'viewShiftUp') { app.viewPort.shift.y -= 5; }
  if(action === 'viewShiftDown') { app.viewPort.shift.y += 5; }
  if(action === 'viewShiftLeft') { app.viewPort.shift.x -= 5; }
  if(action === 'viewShiftRight') { app.viewPort.shift.x += 5; }
  if(action === 'switchClickAction') { app.response.changeMode(); }
  if(action === 'pause') { app.response.pause(); }  
  if(action === 'visualLogging') { app.SHOWCLOCK = !app.SHOWCLOCK; }        
  if(action === 'follow') { app.response.incrementFollow(); } 
  if(action === 'speedItUp') { app.response.speedUp(); }
  if(action === 'slowItDown') { app.physics.updateTimeStep(app.physics.variables.TIME_STEP / 2); }  
};

Feedback.prototype.handleConsole = function(e) {
  app.textParser.handleConsole();
};

Feedback.prototype.onCommandExit = function() {
  app.response.CommandMode = 'COMMAND';
  app.display.focus();
  app.eventListener.addEventListener("keydown", app.response.eventHandle);

  app.toggleConsoleVisibility(false);
};


Feedback.prototype.switchCommandMode = function() {
  app.response.CommandMode = 'shell';
  app.eventListener.removeEventListener("keydown", app.response.eventHandle);

  app.toggleConsoleVisibility(true);
  shellJs.init(app.console, app.response.onCommandExit, app.response.commands, true, { keyCode: 192, displayText: "~ or `" } );
};

Feedback.prototype.changeMode = function() {
  if (app.response.MODE === 'FOLLOW') {
    app.response.MODE = 'ROCKET';
  } else if ( this.MODE === 'ROCKET') {
    app.response.MODE = 'PHOTON';
  } else if ( this.MODE === 'PHOTON') {
    app.response.MODE = 'DESTROY';
  } else {
    app.response.MODE = 'FOLLOW';
  }
};

Feedback.prototype.speedUp = function() {
  if (app.physics.variables.TIME_STEP < 100) {
    app.physics.updateTimeStep(app.physics.variables.TIME_STEP * 2);
  }
};

Feedback.prototype.follow = function(xy){
  app.FOLLOW = Feedback.prototype.getNearest(xy);
};

Feedback.prototype.input = function() {
  app.CURSOR = true;  
  app.GO = false;
};

Feedback.prototype.getNearest = function(clickXY){
  //Perform this in viewport coordinates.
  //It's viewport's job to furnish the viewport coordinates of any object of interest.
  var jXY, dx, dy,
  indexClosest = 0, j,
  dSqClosest   = Number.MAX_VALUE, dSq;
  
  for (j = 0; j < app.particles.length; j++){
    if (! app.particles[j]) {continue;}
    
    jXY = app.viewPort.MapPositionToViewPortXY(app.particles[j].position);

    dx   = jXY.x - clickXY.x + app.ctx.canvas.offsetLeft;
    dy   = jXY.y - clickXY.y + app.ctx.canvas.offsetTop;
    dSq  = dx * dx + dy * dy;

    if (dSq < dSqClosest){
      dSqClosest    = dSq;
      indexClosest  = j;
    }
  }
  return indexClosest;
};

Feedback.prototype.destroy = function(xy){
  var target;

  if (app.particles.length){
    target = app.particles[Feedback.prototype.getNearest(xy)];
    target.die(target.name + " was destroyed by the creator.");

    if(app.FOLLOW == target.id) {
      app.FOLLOW = 0;
    }
  }
};

Feedback.prototype.rocket = function(){
  var x = new Particles().buildParticle(  {name: 'ROCKET!! ' + app.particles.length, mass: 1/ 1500000000, radius: 10, orbitalVelocity: 0.08 - Math.random() * 0.08, arc: Math.PI / 2, distance: app.physics.constants.ASTRONOMICAL_UNIT * 2, drawSize: 0.1}),
    newGuy = app.particles[app.particles.length -1];

  if(app.response.MODE === 'PHOTON') {
    newGuy.name = 'PHOTON' + app.particles.length;
    newGuy.mass = 0;
    var arc = 0;//Math.random() * 2 * Math.PI;
    
    newGuy.position.setFromV(app.particles[0].position);
    newGuy.vel.setXYZ(5000 * Math.cos(arc),
      5000 * Math.sin(arc), 
      0.0);
  } else {
    newGuy.position.setFromV(app.particles[app.FOLLOW].position);
    newGuy.position.increment(Vector3d.prototype.randomOfMagnitude(0.3));

    newGuy.vel.setFromV(app.particles[app.FOLLOW].vel);
    newGuy.vel.increment(Vector3d.prototype.randomOfMagnitude(0.0003 * Math.random()));
    app.FOLLOW = app.particles.length - 1;
  }
  
  app.PARTICLECOUNT = app.particles.length - 1;
};

Feedback.prototype.reset = function() {
  if(app.physics.variables.CALC_STYLE !== 'real') {
    app.physics.variables.CALC_STYLE = 'real';
  } else {
    app.physics.variables.CALC_STYLE = 'wacky';
    //app.physics.variables.CALC_STYLE_VELOCITY_MOD = Math.floor(Math.random() * 10) + 1;
  }

  app.ctx.clearRect(0, 0, app.width, app.height);
  var x = new Particles().buildInitialParticles();
  app.viewPort.colorSorted = false;  
  app.clockReset();

  app.resetPotentialCollisions();
  app.FOLLOW = 0;
};

Feedback.prototype.pause = function() {
  //app.physics.updateTimeStep(1);
  if(app.GO === false) {
    app.GO = true;
    requestAnimationFrame(app.viewPort.frame);
    app.clockReset();
  } else {
    app.GO = false;
  }
};

Feedback.prototype.changeView = function() {
  app.viewPort.cycleState();
  app.ctx.font="12px Calibri";
  app.ctx.clearRect(0, 0, app.width, app.height);  
};

Feedback.prototype.incrementFollow = function () {
  var oldFollow = app.FOLLOW;
  do{
    app.FOLLOW += 1;
    if (app.FOLLOW >= app.particles.length) {
      app.FOLLOW = 0;
    }
  } while(app.particles[app.FOLLOW].destroyed && app.FOLLOW != oldFollow);

  app.viewPort.shift.x = 0;
  app.viewPort.shift.y = 0;  
};

Feedback.prototype.changeProperty = function(id, propName, newValue) {
  app.particles[id][propName] = newValue;
};

Feedback.prototype.addParticle = function(massX, radX, eC, arc, name) {
  var eccentricity = eC === null ? 1 : eC / 100,
    radians = arc === null ? Math.random() * 2 * Math.PI : arc,
    text = name === null ? 'planet-X' : name;
  var cfg = {name: text, mass: massX / 100, radius: 1097, 
      orbits: [{mass: 1047 * eccentricity, radius: radX * 5}], arc: radians, drawSize: 1};
  var x = new Particles().buildParticle(cfg);
  return x;
};

Feedback.prototype.addCloud = function(cnt, rC, rF) {
  var x = new Particles();

  for(var y = 0; y < cnt; y++) {
    var rad = rC * 5 + (Math.random() * (rF - rC)) * 5;
    var cfg = {name: 'cloud-' + y, mass: 1 / 10000, radius: 1097, 
      orbits: [{mass: 1047 +  Math.random() * 100, radius: rad}], arc: Math.random() * 2 * Math.PI, drawSize: 0.1};
    x.buildParticle(cfg);
  }

  return x;
};

Feedback.prototype.destroyAll = function() {
  var me = this;
  app.FOLLOW = 0;
  app.particles.splice(1, app.particles.length - 1);
  app.alwaysIntegrate.splice(1, app.alwaysIntegrate.length - 1);
};

Feedback.prototype.resetViewToHome = function() {
  app.FOLLOW = 0;
  app.physics.updateTimeStep(1);
  app.viewPort.restoreDefault();
};

Feedback.prototype.getFocusId = function(){
  if (app.particles.length){
    if (!app.particles[app.FOLLOW]){
          app.FOLLOW = 0;
    }
  }else{
    app.response.reset();
  }
  return app.FOLLOW;
};

// function TextParser() { 
// }

// TextParser.prototype.handleConsole = function() {
// };


module.exports = Feedback;
},{}],2:[function(require,module,exports){
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

},{"./feedback":1,"./particles":4,"./physics":5,"./thrust":6,"./viewport":8}],3:[function(require,module,exports){

var Vector3d = require('./vector3d');

function Particle(id, x, y, z) {
  this.id = id; 
  this.position = new Vector3d(x,y,z);
  this.vel = new Vector3d(0, 0, 0);
  this.acc = new Vector3d(0, 0, 0);
  this.acc_old = new Vector3d(0, 0, 0);
  this.acc_Swap = this.acc; //To flip flop back and forth, re-using the vectors.
  this.r = new Vector3d(0, 0, 0); //Vector pointing from self to another.
  this.dt = app.physics.variables.TIME_STEP_INTEGRATOR;
  this.dt_old = this.dt;
  this.destroyed = false;

  this.mass = 2;
  this.color = {r: 205 + 50 * Math.floor(Math.random() * 3), 
    g:  205 + 50 * Math.floor(Math.random() * 3),
    b:  205 + 50 * Math.floor(Math.random() * 3)};
}

Particle.prototype.die = function(message){
  this.destroyed = true;
  console.log(message);
};


Particle.prototype.speed_squared = function(){
  return this.vel.sumsq() / (this.dt*this.dt);
};

Particle.prototype.velocity = function(){
  return new Vector3d(this.vel.x, this.vel.y, this.vel.z).scale( 1 / this.dt);
};

Particle.prototype.acceleration = function(){
  return new Vector3d(this.acc.x, this.acc.y, this.acc.z).scale(2 / (dt*dt));
};

Particle.prototype.updateTimeStep = function(dt_new){
  this.dt_old = this.dt;
  this.dt = dt_new;
  var f = this.dt / this.dt_old;
  var f_sq = f*f;

  this.vel.x *= f;
  this.vel.y *= f;
  this.vel.z *= f;

  this.acc.x *= f_sq;
  this.acc.y *= f_sq;
  this.acc.z *= f_sq;

  //Leapfrog will discard these contents, but if anthing else needs them, they'll be correct.

  this.acc_old.x *= f_sq;
  this.acc_old.y *= f_sq;
  this.acc_old.z *= f_sq;
};

Particle.prototype.dist = function(p1) {
  this.r.x = p1.position.x - this.position.x;
  this.r.y = p1.position.y - this.position.y;
  this.r.z = p1.position.z - this.position.z;

  var d2 =  this.r.x * this.r.x + 
      this.r.y * this.r.y + 
      this.r.z * this.r.z;
  return Math.sqrt(d2);
};


Particle.prototype.calcAcceleration = function(){
  var curr,
    grav,
    i;
  var d, d2, d3;
  var dt_sq_over2 = (this.dt * this.dt) / 2;
  this.accSwap = this.acc_old; //To Re-use.
  this.acc_old = this.acc;
  this.acc = this.accSwap;
  this.acc.zero();

  for (i = 0; i < app.particles.length; i++) {
    curr = app.particles[i];
    if(curr.id !== this.id ) {
      this.r.x = curr.position.x - this.position.x;
      this.r.y = curr.position.y - this.position.y;
      this.r.z = curr.position.z - this.position.z;
      //Recommend replacing all tests of d3 with tests against d2.
      d2 =  this.r.x * this.r.x + 
            this.r.y * this.r.y + 
            this.r.z * this.r.z;
      d  = Math.sqrt(d2);
      d3 = d2 * d;

      if (d < app.COLLISION_IMMENENCE_RANGE) {
        this.checkPotentialCollision(d, curr);
      }
      // if(d3 < app.closestPair.d || app.closestPair === 0) {
      //   app.closestPair.d = Math.sqrt(dx * dx + dy * dy);
      //   app.closestPair.d = app.closestPair.d * app.closestPair.d;
      //   app.closestPair.x = this;
      //   app.closestPair.y = curr;
      // }

      if(d3 > 0) {
        this.r.scale(curr.mass / d3);
        this.acc.increment(this.r);
      }
    }
  }
  this.acc.scale(app.physics.constants.GRAVITY_CONSTANT * dt_sq_over2);
};

Particle.prototype.checkPotentialCollision = function(d, curr) {
  // collision detection: if we're in range, add us (this particle and it's acceleration pair)
  // to the global list of potential collisions.  To avoid redundant work, only do this when
  // this particle has the lower id of the pair.  (don't do it twice when we calculate the inverse)
  if (this.id < curr.id) {
    var lastBucket = -1;
    for (var bucket in app.potentialCollisions) {
      var num = Number(bucket) / 100;
      if (lastBucket < d && d < num)
        app.potentialCollisions[(lastBucket * 100).toString()].push([this.id, curr.id]);

      lastBucket = num;
    }
  }
};

Particle.prototype.updatePosition = function() {
  this.position.x += this.acc.x;
  this.position.y += this.acc.y;
  this.position.z += this.acc.z;

  this.position.x += this.vel.x;
  this.position.y += this.vel.y;
  this.position.z += this.vel.z;
};

Particle.prototype.updateVelocity = function() {
  this.oldDirection = this.vel.phi() * 180 / Math.PI;

  this.vel.x += (this.acc_old.x + this.acc.x);
  this.vel.y += (this.acc_old.y + this.acc.y);
  this.vel.z += (this.acc_old.z + this.acc.z);

  this.direction = this.vel.phi() * 180 / Math.PI;
};

Particle.prototype.kineticE = function(){
  return this.mass * this.speed_squared()/ 2;
};

Particle.prototype.isBoundTo = function(p2){
  //The expression is equivalent to Mechanical Energy < 0
  var vSq = this.velocity().dist_squared(p2.velocity());
  var d  = this.position.distance(p2.position);
  var GM = app.Physics.GRAVITY_CONSTANT*(this.mass+p2.mass);
  var isBound = (d * (vSq / 2) < GM);
  return isBound;
};

Particle.prototype.checkClock = function() {
  return Math.abs((this.oldDirection - this.direction)) > 10;
};

Particle.prototype.configure = function(config) {
  var particle = this,
    localOrbitalVelocity = 0,
    localRadius = config.distance || 0;

  if(config.arc === undefined) {
    config.arc = Math.random() * 2 * Math.PI;
  }
  if(config.color) {
    particle.color = config.color;
  }
  if(config.id === undefined) {
    particle.id = app.particles.length;
  }

  if(config.orbits) {
    for(var i = 0; i < config.orbits.length; i++) {
      var orbital = config.orbits[i],
        parentGrav = orbital.mass * app.physics.constants.ORIGINAL_GRAVITY_CONSTANT;
      localOrbitalVelocity += (Math.sqrt(parentGrav / (orbital.radius)) * app.physics.constants.ORIGINAL_VELOCITY_FACTOR);
      localRadius += orbital.radius;

      if(orbital.eccentric === 'little') {
        localOrbitalVelocity += Math.random() * parentGrav / 800;
      } else if(orbital.eccentric !== undefined) {
        localOrbitalVelocity = parentGrav * orbital.eccentric;
      }
    }

    if(app.physics.variables.CALC_STYLE !== 'real') {
      localOrbitalVelocity *= app.physics.variables.CALC_STYLE_VELOCITY_MOD;
    }

  } else {
    localOrbitalVelocity = config.orbitalVelocity * app.physics.constants.ORIGINAL_VELOCITY_FACTOR;
  }

  particle.radius = config.radius || 100000;
  particle.normalizedRadius = app.physics.constants.ASTRONOMICAL_UNIT * particle.radius / app.physics.constants.KM_PER_AU;
  particle.name = config.name;
  particle.mass = config.mass;

  particle.position.x = app.halfWidth - localRadius * Math.cos(config.arc);
  particle.position.y = app.halfHeight - localRadius * Math.sin(config.arc);
  particle.position.z = 0.0;
  
  particle.vel.x = localOrbitalVelocity * Math.sin(config.arc);
  particle.vel.y = localOrbitalVelocity * (-Math.cos(config.arc));
  particle.vel.z = 0.0;

  particle.vel.scale(app.physics.variables.TIME_STEP_INTEGRATOR);
  
  //Just for safety, initialize to zero.  
  particle.acc.x = 0;
  particle.acc.y = 0;
  particle.acc.z = 0;


  particle.size = config.drawSize;    
  particle.drawColor = '#' + this.color.r.toString(16) + this.color.g.toString(16) + this.color.b.toString(16);
};

module.exports = Particle;
},{"./vector3d":7}],4:[function(require,module,exports){
var Particle = require('./particle');

function Particles() {
  this.objects = {};
  this.objects.COMETS = 20;// Math.floor( Math.random() * 1250);
  this.objects.ASTEROIDS = 5;// Math.floor( Math.random() * 1250);
  this.objects.JUPITERCLOUD = 8; //Math.floor( Math.random() * 1250);
  this.objects.PARTICLECOUNT = 1;  
}

Particles.prototype.buildInitialParticles = function() {
  var width = app.halfWidth,
    height = app.halfHeight,
    particles = app.particles,
    jupiterMass = 1,
    earthMass = jupiterMass / 317,
    sunMass = jupiterMass * 1047,
    //sunGravity = app.physics.constants.ORIGINAL_GRAVITY_CONSTANT * sunMass,
    aU = app.physics.constants.ASTRONOMICAL_UNIT,
    initalObjects = {},
    jupiterArc = Math.PI + 0.00000001,
    cfg = {};

    app.particles = [];
    app.alwaysIntegrate = [];

  if(app.physics.variables.CALC_STYLE === 'real') {
    initialObjects = [
      {name: 'Sun', mass: jupiterMass * 1047, radius: 696342, orbitalVelocity: 0, drawSize: 3, color: {r: 255, g: 255, b: 220}},
      {name: 'Mercury', mass: earthMass * 0.055, radius: 2439, orbits: [{mass: sunMass, radius: aU * 0.387098}], drawSize: 0.5},
      {name: 'Venus', mass: earthMass * 0.815, radius: 6051, orbits: [{mass: sunMass, radius: aU * 0.72}], drawSize: 1},
      {name: 'Earth', mass: earthMass, radius: 6371, orbits: [{mass: sunMass, radius: aU}], arc: jupiterArc, drawSize: 1, color: {r: 180, g: 200, b: 255}},
      {name: 'Mars', mass: earthMass * 0.107, radius: 3376, orbits: [{mass: sunMass, radius: aU * 1.38}], drawSize: 0.6, color: {r: 255, g: 160, b: 160}},
      {name: 'Jupiter', mass: jupiterMass, radius: 69911, orbits: [{mass: sunMass, radius: aU * 5.2}], arc: jupiterArc, drawSize: 1.4},    
      {name: 'Saturn', mass: jupiterMass * 0.30, radius: 60268,orbits: [{mass: sunMass, radius: aU * 9.5}], drawSize: 1.3, color: {r: 255, g: 215, b: 165}},
      {name: 'Neptune', mass: earthMass * 17.147, radius: 24341,orbits: [{mass: sunMass, radius: aU * 30}], drawSize: 1, color: {r: 150, g: 160, b: 215}},
      {name: 'Uranus', mass: earthMass * 14.536, radius: 25362,orbits: [{mass: sunMass, radius: aU * 19.5}], drawSize: 1, color: {r: 180, g: 180, b: 215}},
      {name: 'Ganymede', mass: earthMass * 0.025, radius: 1234,orbits: [{mass: sunMass, radius: aU * 5.2}, {mass: jupiterMass, radius: aU * 0.014}], arc: jupiterArc, drawSize: 0.6},
      {name: 'Moon', mass: earthMass * 0.0123, radius: 1097,orbits: [{mass: sunMass, radius: aU}, {mass: earthMass, radius: aU * 0.00257}], arc: jupiterArc, drawSize: 0.6},
      {name: 'AlphaCentauri', mass: jupiterMass * 1047 * 3.1, radius: 696342, distance: aU * app.physics.constants.LIGHTYEAR_PER_AU * 4, orbitalVelocity: 0, arc: -Math.PI, drawSize: 3, color: {r: 255, g: 215, b: 230}},
    ];

  } else {
//     var centerMass =  Math.floor(30 + jupiterMass * Math.random() * 3000),
//       colorShift = (1 - (centerMass / 3000)) / 2;
//       planetMass = earthMass * Math.random() / 600;
//     initialObjects = [
//       {name: 'Star', mass: centerMass, radius: 800000, orbitalVelocity: 0, drawSize: 3, color: {r: 255, g: 255 - Math.floor(255 * colorShift), b: 255 - Math.floor(220 * colorShift)}}
// //      {name: 'Planet 1', mass: planetMass, radius: 69911, orbits: [{mass: centerMass * Math.sqrt(centerMass), radius: aU + aU * Math.random() * 8}], drawSize: .6, color: {r: 255, g: 215, b: 165}}
//     ];

    var brownDwarfMass = 1000 * jupiterMass + Math.random() * 250;
    this.buildParticle({name: 'Brown Dwarf ' + i, radius: 696342, mass: brownDwarfMass, orbitalVelocity: 0, distance: 0, drawSize: 1});

    this.buildParticle({name: 'Saturn-like ' + i, radius: 69911, mass: jupiterMass * 0.3, orbits: [{mass: brownDwarfMass + (Math.random() * 50), radius: 1.8 * aU}], drawSize: 1});

    // for (i = 0; i < 40; i++) {
    //   var tmass =  jupiterMass / 80,
    //     tradius = 69911 / 400;
    //   this.buildParticle({name: 'Asteroid ' + i, radius: tradius, mass: tmass, orbitalVelocity: 0, distance:  Math.random() * aU / 2 + .0001, drawSize: .1});
    // }

    for (i = 0; i < 900; i++) {
      var tmass =  earthMass / 20,
        tradius = 6371 / 0.1;
      this.buildParticle({name: 'Asteroid ' + i, radius: tradius, mass: tmass, orbits: [{mass: brownDwarfMass + 1 * (Math.random() / 100), radius: 1.6 * aU + aU * Math.random() * 0.4}], drawSize: 0.1});
    }

    // for (i = 0; i < 400; i++) {
    //   var tmass =  earthMass * .017 / 400,
    //     tradius = 800000;
    //   this.buildParticle({name: 'Asteroid ' + i, radius: 6000, mass: tmass, orbits: [{mass: sunMass, radius: aU * 1.38 + aU / (Math.random() * 80)}], drawSize: .3});
    // }

    // app.particles = app.particles.sort(function(itm, itm2) {
    //   return (10 * itm.radius) < (10 * itm2.radius);
    // });
  }

  while(initialObjects.length > 0) {
    this.buildParticle(initialObjects.shift());
  }

  for(i = 0; i < app.particles.length; i++) {   
    app.alwaysIntegrate.push(i);
  }

  for (i = 0; i < this.objects.ASTEROIDS; i++) {
    this.buildParticle({name: 'Asteroid ' + i, radius: 60, mass: earthMass / (8000 + Math.random() * 25000), orbits: [{mass: sunMass, eccentric: 'little', radius: aU * 1.5 + aU * Math.random() * 3.5}], drawSize: 0.1});
  }

  for (i = 0; i < this.objects.COMETS; i++) {
    this.buildParticle({name: 'COMET' + i, radius: 60, mass: earthMass / (8000 + Math.random() * 25000),  distance: aU * 16 + aU * (Math.random() * 1340), orbitalVelocity: -0.34 + Math.random() * 0.62, drawSize: 0.1});
  }

  if(app.physics.variables.CALC_STYLE === 'real') {
    for (i = 0; i < this.objects.JUPITERCLOUD; i++) {
      this.buildParticle({
        name: 'Jupiter Cloud' + i, 
        radius: 60,
        arc: jupiterArc + Math.random() * Math.PI / 160 - Math.random() * Math.PI / 80, 
        mass: earthMass / (8000 + Math.random() * 32000), 
        orbits: [
          {mass: sunMass, radius: aU * 5.2}, 
          {mass: jupiterMass, eccentric: 'little', radius: aU * 0.01 + aU * Math.random() * 0.08}], 
        drawSize: 0.03
      });
    }
  }
  //this.buildParticle({name: 'LIGHTYEAR EXPRESS', mass: 1 / 500000000000000, radius: app.physics.constants.LIGHTYEAR, arc: 0, orbitalVelocity: .300, drawSize: 1});
  //app.particles[app.particles.length-1].oldX = app.particles[app.particles.length-1].x - (328 * app.physics.constants.ASTRONOMICAL_UNIT);
};

Particles.prototype.finalize = function() {
  //Find momentum of system
  var particles = app.particles,
    i,
    system_momentum = new Vector3d(0, 0, 0);
    
  for (i = 0; i < particles.length; i++) {
      var vel = particles[i].vel.asXYZ;
      system.momentum.x += me.mass * vel.x;
      system.momentum.y += me.mass * vel.y;
      system.momentum.z += me.mass * vel.z;
  }
  //Give the Sun a little kick to zero out the system's momentum:
  var sun = app.particles[0];
  var sunVel  = sun.vel.asXYZ();
  sunVel.x -= system_momentum.x / sun.mass;
  sunVel.y -= system_momentum.y / sun.mass;
  sunVel.z -= system_momentum.z / sun.mass;
  sun.vel.setXYZ(sunVel.x, sunVel.y, sunVel.z);

  //This has to be done once before integration can occur. Prime The Pump!
  for (i = 0; i < app.particles.length; i++) {
    app.particles[i].calcAcceleration(app.physics.variables.TIME_STEP_INTEGRATOR);
  }

  app.PARTICLECOUNT = app.particles.length -1;
};

Particles.prototype.buildParticle = function(cfg) {
  var tmp = new Particle();
  tmp.configure(cfg);
  app.particles.push(tmp);
};

Particles.prototype.freeTheDestroyed = function() {
  var survivors = [];
  var newId = 0;

  for (var j = 0; j < app.particles.length; j++) {
    if (app.FOLLOW == j) { 
      app.FOLLOW = newId;
    }
    if (app.particles[j] && app.particles[j].destroyed === false){
      survivors.push(app.particles[j]);
      app.particles[j].id = newId++;
    }
  }

  if(app.FOLLOW >= survivors.length) {
    app.FOLLOW = 0;
  }

  app.particles = survivors;
};


module.exports = Particles;
},{"./particle":3}],5:[function(require,module,exports){
function Physics() {
  this.constants = {};
  this.constants.DAMPING = 1;
  this.constants.GRAVITY_CONSTANT = 1 / 100;   // 1500 will result in a time-step equal to about 1 earth-day.  lower is faster.
  this.constants.ORIGINAL_GRAVITY_CONSTANT = 1 / 100; // helps us get back to a base-state.
  this.constants.ORIGINAL_VELOCITY_FACTOR = 1;
  this.constants.JUPITER_MASS = 1;
  this.constants.EARTH_MASS = 1 / 317;
  this.constants.ASTRONOMICAL_UNIT = 50;  // astronomical unit / ie, 1 Earth distance from the sun.
  //Or, 50 simulation units = 1AU, or sim unit = 0.02 AU;
  this.constants.MILES_PER_AU = 92560000;
  this.constants.KM_PER_AU = 149586761;
  this.constants.LIGHTYEAR_PER_AU = 63239.72;
  this.constants.LIGHTYEAR = this.constants.ASTRONOMICAL_UNIT * this.constants.LIGHTYEAR_PER_AU;


  this.constants.EARTH_HOURS_PER_TICK_AT_TIME_STEP_1 = 13.9254843517139;
  this.constants.TIME_STEP_NORMALIZER = 0.861729452054792;

  this.variables = {};
  this.variables.TIME_STEP = 1;
  this.variables.TIME_STEP_INTEGRATOR = this.variables.TIME_STEP * this.constants.TIME_STEP_NORMALIZER;
  this.variables.TIME_STEP_INTEGRATOR_OLD = this.variables.TIME_STEP_INTEGRATOR;
  this.variables.CALC_STYLE = 'real';
  this.variables.CALC_STYLE_VELOCITY_MOD = 1;
}

Physics.prototype.updateTimeStep = function(newTimeStep) {
  this.variables.TIME_STEP_INTEGRATOR_OLD = this.variables.TIME_STEP_INTEGRATOR;
  this.variables.TIME_STEP = newTimeStep;
  this.variables.TIME_STEP_INTEGRATOR = newTimeStep * this.constants.TIME_STEP_NORMALIZER;
};

Physics.prototype.reverseTime = function() {
  this.updateTimeStep(this.variables.TIME_STEP * -1);
};

Physics.prototype.leapFrog = function () {
  dt_this_iteration= this.variables.TIME_STEP_INTEGRATOR;

  var ps = app.particles,
    i;
  if (dt_this_iteration != this.TIME_STEP_INTEGRATOR_OLD){
    for (i = 0; i < ps.length; i++) {
      ps[i].updateTimeStep(dt_this_iteration);
    }  
  }

  for (i = 0; i < ps.length; i++) {
    ps[i].updatePosition();
  }

  for (i = 0; i < ps.length; i++) {
    ps[i].calcAcceleration(dt_this_iteration);
  }

  for (i = 0; i < ps.length; i++) {
    ps[i].updateVelocity();
  }  

  if(app.response.MODE === 'ROCKET') {
    rocketVel = ps[app.FOLLOW].vel.asXYZ();
    rocketVel.x -= app.thrust.getThrustVector().x / 3000;
    rocketVel.y -= app.thrust.getThrustVector().y / 3000;
    rocketVel.z -= app.thrust.getThrustVector().z / 3000;
    ps[app.FOLLOW].vel.setXYZ(rocketVel.x, rocketVel.y, rocketVel.z);
  }
};

Physics.prototype.collide_glom = function(p1, p2) {
  var big, little;
  if (p1.mass > p2.mass){
    big = p1;
    little = p2;
  } else{
    big = p2;
    little = p1;
  }
  var mass  = big.mass    + little.mass;
  var fracB = big.mass    / mass;
  var fracL = little.mass / mass;


  var vol = 1.33 * Math.PI * Math.pow(big.radius, 3);
  var newVolume = mass / (big.mass / vol);
  big.radius = Math.cbrt((newVolume * 0.75 / Math.PI));
  big.normalizedRadius = app.physics.constants.ASTRONOMICAL_UNIT * big.radius / app.physics.constants.KM_PER_AU;

  big.mass = mass;
  
  big.position.scale(fracB);
  little.position.scale(fracL);
  big.position.increment(little.position);
  
  big.vel.scale(fracB);
  little.vel.scale(fracL);
  big.vel.increment(little.vel);

  big.acc.scale(fracB);
  little.acc.scale(fracL);
  big.acc.increment(little.acc);

  big.acc_old.scale(fracB);
  little.acc_old.scale(fracL);
  big.acc_old.increment(little.acc_old);

  little.die(little.name + " was swallowed by " + big.name + ".");
  if(app.FOLLOW === little.id) {
    app.FOLLOW = big.id;
  }
  return {big: big, little: little};
};

Physics.prototype.getParticleSpeed = function (particle) {
  return Math.sqrt(particle.speed_squared());
};

Physics.prototype.getParticleDirection = function (particle) {
  var followDirection = Math.atan2(particle.vel[1], particle.vel[0]) * 180 / Math.PI;
  if (followDirection < 0.0) {
    followDirection += 360;
  }
  return followDirection;
};

Physics.prototype.createCollidingParticleList = function() {
  var p = app.particles,
    ret = [],
    i,
    j;

  for (i = 0; i < p.length; i++) {
    for (j = i + 1; j < p.length; j++) {
      if (p[i].id != p[j].id) {
        if (this.areParticlesVeryClose(p[i], p[j])) {
          ret.push({big: p[j], little: p[i]});
        }
      }
    }
  }

  return ret;
};

Physics.prototype.handleCollisions = function() {
  var coll = app.potentialCollisions["0"]; //app.flattenPotentialCollisions();
  if (coll.length) {
    for (var pair in coll) {
      var a = app.particles[coll[pair][0]];
      var b = app.particles[coll[pair][1]];
      if (app.physics.areParticlesVeryClose(a, b)) {
        var flip = b.mass > a.mass;
        app.physics.glomParticles([{ big: (flip ? b : a), little: (flip ? a : b)}]);
      }
    }
  }
};

Physics.prototype.glomParticles = function(set) {
  app.collisions += set.length;

  if(set.length > 0) {
    for(var i = 0; i < set.length; i++) {
      this.collide_glom(set[i].big, set[i].little);
    }
  }
};

Physics.prototype.areParticlesVeryClose = function(p1,p2) {
  //return p1.distanceto(p2) < p1.normalizedRadius + p2.normalizedRadius;
  if(!p1 || !p2){
    return false;
  }

  dlimit2 = p1.normalizedRadius + p2.normalizedRadius;
  dlimit2 *= dlimit2;

  return p1.position.dist_squared(p2.position) < dlimit2;
};


Physics.prototype.convertViewPortPixelsToUnits = function(rawSize) {
  var viewPortSize = rawSize,
    unit = ' AU';

  if(rawSize >= app.physics.constants.LIGHTYEAR_PER_AU) {
    viewPortSize = Math.floor(10 * rawSize / app.physics.constants.LIGHTYEAR_PER_AU) / 10;
    unit = ' LIGHTYEARS';
  } else if(rawSize < 1) {
    viewPortSize = Math.floor(rawSize * app.physics.constants.MILES_PER_AU);
    unit = ' MILES';
  } else if( rawSize > 4) {
    viewPortSize = Math.floor(rawSize);
  }

  return {size: viewPortSize, unit: unit};
};


module.exports = Physics;
},{}],6:[function(require,module,exports){
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
};

Thrust.prototype.updateHeading = function(headingAdjustment) {
  this.heading += headingAdjustment;

  if(this.heading > 360) {
    this.heading = 0;
  }
  if(this.heading < 0) {
    this.heading = 360;
  }
};

Thrust.prototype.getThrustVector = function() {
  if(!this.burning) {
    return {x: 0, y:0, z:0};
  }

  return { 
    x: this.thrust * Math.cos(Math.PI * this.heading / 180) / 1000,
    y: this.thrust * Math.sin(Math.PI * this.heading / 180) / 1000,
    z: 0.0
  };
};

Thrust.prototype.updateThrust = function(thrustAdjustment) {
  this.thrust += thrustAdjustment;
};

Thrust.prototype.toggleBurn = function() {
  this.burning = !this.burning;

  if(!this.burning) {
    this.thrust= 0;
  }
};

module.exports = Thrust;
},{}],7:[function(require,module,exports){
function Vector3d(x, y, z){
	this.x = x;
	this.y = y;
	this.z = z;
}

Vector3d.prototype.setXYZ = function(x, y, z){
	this.x = x;
	this.y = y;
	this.z = z;
};

Vector3d.prototype.setFromV = function(v){
	this.x = v.x;
	this.y = v.y;
	this.z = v.z;
};

Vector3d.prototype.asXYZ = function(){
	return { x: this.x,
			y: this.y,
			z: this.z}
};

Vector3d.prototype.zero = function(){
    this.setXYZ(0., 0., 0.);
}


Vector3d.prototype.sumsq = function(){
	//The cheapest "size" measure of a vector.
	return  this.x*this.x +
			this.y*this.y +
			this.z*this.z;
};

Vector3d.prototype.magnitude = function(){
	return Math.sqrt(this.sumsq());
}


Vector3d.prototype.dot = function(v){
	return  this.x*v.x + 
			this.y*v.y + 
			this.z*v.z;
};

Vector3d.prototype.dist_squared = function(v){
	var dx, dy, dz;
	dx = this.x - v.x;
	dy = this.y - v.y;
	dz = this.z - v.z;
	return dx*dx + dy*dy + dz*dz;
};

Vector3d.prototype.distance = function(v){
	return Math.sqrt(this.dist_squared(v));
};

Vector3d.prototype.dist_cubed = function(v){
	var d = this.distance(v);
	return d*d*d;
};

Vector3d.prototype.rOverRCubed_in_place = function(){
	//Takes a vector and _overwrites_ it with r_vector/r^3
	//This is exactly the gravity vector dependence.
	var r_sq = this.sumsq();
	var r_cubed = r_sq * Math.sqrt(r_sq);
	this.x /= r_cubed;
	this.y /= r_cubed;
	this.z /= r_cubed;
}

Vector3d.prototype.FasterSqrt = function(xsq){
	//No Error Checking whatsoever.  Also, not optimized yet, so do not expect actual speed yet.
	var Numbuffer = new ArrayBuffer(4); //Bytes; float's typical size.
	var f32View = new Float32Array(Numbuffer);
	var bitsView = new Uint32Array(Numbuffer);
	var one = new ArrayBuffer(4);
	var float32_one = new Float32Array(one);
	var bits_one = new Uint32Array(one);
    
    float32_one[0] = 1.;

	f32View[0] = xsq;
	bitsView[0] = (bitsView[0] + bits_one[0]) / 2;

	x = f32View[0];
	x = (x+xsq/x) / 2.
	return (x+xsq/x)/2;
}


Vector3d.prototype.increment = function(v){
	this.x += v.x;
	this.y += v.y;
	this.z += v.z;
};

Vector3d.prototype.decrement = function(v){
	this.x -= v.x;
	this.y -= v.y;
	this.z -= v.z;
};

Vector3d.prototype.scale = function(a){
	this.x *= a;
	this.y *= a;
	this.z *= a;
};

Vector3d.prototype.unitRandom = function(){
	// Randomly directed uniformly over sphere.
	var costheta = 2 * Math.random() - 1.;
	var sintheta = Math.sqrt(1. - costheta*costheta);
	var phi = 2*Math.PI*Math.random();
	return new Vector3d(Math.cos(phi)*sintheta, Math.sin(phi)*sintheta, costheta);
};

Vector3d.prototype.randomOfMagnitude = function(magnitude){
	//Randomly directed, but fixed magnitude:
	var u = Vector3d.prototype.unitRandom();
	u.scale(magnitude);
	return u;
};


Vector3d.prototype.unitFromAngles = function(theta, phi){
	// Phi is the angle in the x-y plane (called azimuth, like longitude)
	// theta is the angle from the north celestial pole (like latitude, but starts at 0 at pole)
	costheta = Math.cos(theta);
	sintheta = Math.sin(theta);
	cosphi = Math.cos(phi);
	sinphi = Math.sin(phi);
	u = new Vector3d(cosphi*sintheta, sinphi*sintheta,costheta);
	return u;
};

Vector3d.prototype.unitVector = function(){
	var u =Vector3d(this.x, this.y, this.z);
	u.scale(1. / this.magnitude());
	return u;
};

Vector3d.prototype.angles = function(){
	//Should I set these and carry them around?... No?
	v = this.unitVector();
	theta = Math.acos(v.z);
	phi   = Math.atan2(v.y, v.x);
	return [theta, phi];
};

Vector3d.prototype.phi = function(){
	//Azimuthal angle.
	//Extremely cheap relative to getting both theta and phi.
	return Math.atan2(this.y, this.x);
};

Vector3d.prototype.theta = function(){
	//Theta meaured from north pole.
	// This method avoids a Math.sqrt() call.
	
	if (this.z == 0) {
		return Math.PI / 2.;
	}else{
		var sgn = this.z / abs(this.z);
		//Since cos(x)**2 = 1/2 (cos(2 x)+1)
		cos_sq_theta = this.z*this.z/ this.sumsq();
		abstheta = Math.acos(2. * cos_sq_theta - 1.) / 2.;
		return sgn * abstheta;
	}
};

Vector3d.prototype.cross = function(v2){
	v1Xv2 = new Vector3d(this.y*v2.z - this.z*v2.y,
						-this.x*v2.z + this.z*v2.x,
						 this.x*v2.y - this.y*v2.x);
	return v1Xv2;
};

Vector3d.prototype.projectPlane = function(plane){
	//Plane is a Vector3d perpendicular to that plane.
	var projectedV = new Vector3d(this.x, this.y, this.z);
	var z = plane.dot(projectedV);
	projectedV.x -= z * plane.x;
	projectedV.y -= z * plane.y;
	projectedV.z -= z * plane.z;
	return projectedV;
};


module.exports = Vector3d;
},{}],8:[function(require,module,exports){

/* ******************* VIEWPORT ******************************************************* */

var Vector3d = require('./vector3d');

function ViewPort(app) {
  this.app = app;
  this.frameCount = 0;
  this.txtOffset = 25;
  this.lineHeight = 20;
  this.draw = true;
  this.viewAngle   = 0; //Math.PI / 3;
  this.viewPhi     = 0;
  this.shift   = {x: -50, y: 0, z: 0, zoom: 0};
  this.focusId = 0;
  this.focusLocation = new Vector3d(0, 0, 0);
  this.viewPortSize = (app.width / (this.shift.zoom + 1)) / app.physics.constants.ASTRONOMICAL_UNIT;
  this.viewPortSizeInKm = app.physics.constants.KM_PER_AU * this.viewPortSize;
  this.colorSorted = false;
  this.DRAW_STATE_STATIC = 0;
  this.DRAW_STATE_ROTATE = 1;
  this.MAX_DRAW_STATE       = 1;
  this.DRAW_STATE_SPLASH    = 4;
  this.drawState = this.DRAW_STATE_SPLASH;
}

ViewPort.prototype.cycleState = function(){
  this.drawState++;
  if (this.drawState > this.MAX_DRAW_STATE) this.drawState = 0;
};

ViewPort.prototype.setAxes = function(theta, phi){
  this.xAxis = Vector3d.prototype.unitFromAngles(Math.PI/2, this.viewPhi);
  this.yAxis = Vector3d.prototype.unitFromAngles(this.viewAngle+Math.PI/2, this.viewPhi + Math.PI/2);
  this.zAxis = this.xAxis.cross(this.yAxis);
};

ViewPort.prototype.setFocus = function(){
  this.focusId = app.response.getFocusId();
  if (app.particles[this.focusId]){
    this.focusParticle = app.particles[this.focusId];
    this.focusLocation.setFromV(this.focusParticle.position);
    return true;
  }else{
    return false;
  }
};

ViewPort.prototype.restoreDefault = function(){
  this.viewAngle   = 0;
  this.viewPhi     = 0;
  this.shift       = {x: -50, y: 0, z: 0, zoom: 0};
  this.setAxes(this.viewAngle, this.viewPhi);
  this.setFocus();
};

ViewPort.prototype.reorient = function(pointerOld, pointerNew){
  var deltaX = pointerNew.x - pointerOld.x;
  var deltaY = pointerNew.y - pointerOld.y;
  
  this.viewAngle += deltaY * Math.PI/128;
  this.viewPhi   -= deltaX * Math.PI/64;

  if (this.viewAngle < 0) {
    this.viewAngle = 0;
  } else if (this.viewAngle > Math.PI) {
    this.viewAngle = Math.PI;
  }

  if (this.viewPhi > 2 * Math.PI) {
    this.viewPhi -= 2*Math.PI;
  } else if (this.viewPhi < -2 * Math.PI) {
    this.viewPhi += 2*Math.PI;
  }
};


ViewPort.prototype.splash = function() {
  var version = "2.0";
  this.appendLine("Planetary Gravity Simulator");
  this.appendLine("v " + version);
  this.appendLine("");
  this.appendLine("Type 'V' to exit the splash screen.");
  this.appendLine("Type '~' to enter console mode, and type help from there to learn about commands.");
  this.appendLine("Also has one-key instant commands in direct mode: ");
  this.appendLine('....Toggle mouse rotation- V');
  this.appendLine('....trace - <space>');
  this.appendLine('....reset - R');
  this.appendLine('....reverseTime - T');
  this.appendLine('....viewShiftUp - W');
  this.appendLine('....viewShiftDown - S');
  this.appendLine('....viewShiftLeft - A');
  this.appendLine('....viewShiftRight - D');
  this.appendLine('....switchClickAction - M');
  this.appendLine('....pause - P');
  this.appendLine('....visualLogging - C');
  this.appendLine('....follow - F');
  this.appendLine('....speedItUp - X');
  this.appendLine('....slowItDown - Z');
  this.appendLine('....toggleCommandMode - ~');
  this.appendLine('....zoomOut - <');
  this.appendLine('....zoomIn - >');
  this.appendLine('....zoom - Mousewheel');
  this.appendLine('....switchToDefaultView - H');
  this.appendLine('....rocketEnginesBurnToggle - B');
  this.appendLine('....rocketRotateLeft - LEFT');
  this.appendLine('....rocketIncreaseThrust - UP');
};


ViewPort.prototype.drawParticles = function() {
  var particles = app.particles;

  var currColor = particles[0].drawColor;
  app.ctx.strokeStyle = currColor;
  for(var i = 0 ; i < app.particles.length; i++ ){
    if(particles[i].drawColor != currColor) {
      currColor = particles[i].drawColor;
      app.ctx.strokeStyle = currColor;
    }

    this.drawParticle(particles[i]);
  }
};


ViewPort.prototype.MapPositionToViewPortXY = function(position){
  /*Takes the position and maps it to viewport x, y coordinates, by 
  finding it's position relative to the currently followed particle,
  projecting that position onto 2 axes, described by vectors.*/
  var r, xy;
  
  r = new Vector3d(0, 0, 0);
  r.setFromV(position);
  r.decrement(this.focusLocation);

  xy   = {x: r.dot(this.xAxis), y:r.dot(this.yAxis)};
  xy.x = (xy.x)*(1+this.shift.zoom) + app.halfWidth  - this.shift.x;
  xy.y = (xy.y)*(1+this.shift.zoom) + app.halfHeight - this.shift.y;

  return xy;
};




ViewPort.prototype.drawParticle = function(particle) {
  var obj,
    drawSize = particle.size;

  obj = this.MapPositionToViewPortXY(particle.position);

  if(particle.radius > 1) {
    var pctOfViewport = particle.radius / app.viewPort.viewPortSizeInKm;
    drawSize = pctOfViewport * app.width / 2; //app.physics.constants.ASTRONOMICAL_UNIT * pctOfViewport;
    drawSize = drawSize > particle.size ? drawSize : particle.size;
  } else {
    drawSize = 0.2;
  }


  //app.ctx.strokeStyle = particle.drawColor;
  app.ctx.lineWidth = drawSize;
  app.ctx.beginPath();
  

  if(drawSize >= 1) {
    app.ctx.arc(obj.x, obj.y, app.ctx.lineWidth, 0, 2 * Math.PI, false);
    app.ctx.fillStyle = app.ctx.strokeStyle;
    app.ctx.fill();
  } else {
    app.ctx.arc(obj.x, obj.y, app.ctx.lineWidth, 0, 2 * Math.PI, false);
  }


  if(app.response.MODE === 'ROCKET') {
    if(particle.id === this.focusId) {
      var direction = particle.direction / 180 * Math.PI;
      var heading = app.thrust.heading / 180 * Math.PI;
      app.ctx.lineWidth = 3;
      app.ctx.lineTo(obj.x + 12 * Math.cos(direction), obj.y + 12 * Math.sin(direction));

      if(particle.name.slice(0, 6) == 'ROCKET') {
        app.ctx.moveTo(obj.x, obj.y);
        app.ctx.lineTo(obj.x + 24 * Math.cos(heading), obj.y + 24 * Math.sin(heading));
      }
    }
  }

  app.ctx.stroke();
};

ViewPort.prototype.frame = function() {
  var current;

  if(app.GO) {
    requestAnimationFrame(app.viewPort.frame);

    if(!app.TRACE) {
      app.ctx.clearRect(0, 0, app.width, app.height);
    }
    app.viewPort.frameActions();
  }
};

ViewPort.prototype.frameActions = function() {
  if(this.drawState === this.DRAW_STATE_SPLASH) {
    app.ctx.lineWidth = 1;

    app.ctx.font="20px Arial";
    app.ctx.strokeStyle = app.particles[0].drawColor;
    this.txtOffset = 25;
    app.viewPort.splash();
    this.txtOffset = 25;

    app.ctx.beginPath();

    //app.ctx.arc(obj.x, obj.y, app.ctx.lineWidth, 0, 2 * Math.PI, false);
    app.ctx.fillStyle = app.ctx.strokeStyle;
    //app.ctx.fill();
    app.ctx.stroke();
    return;
  }
  app.viewPort.frameClock();
  app.viewPort.integrateWrapper();
  app.viewPort.setClock();
  app.viewPort.setIntegrate();
};

ViewPort.prototype.frameClock = function() {
    this.txtOffset = 25;

  if (app.response.MODE === 'ROCKET') {
    app.viewPort.showRocketTelemetry();
  } else if (app.SHOWCLOCK) {
    this.appendLine("Started:" + app.realTime);
    this.appendLine("Now:" + Date());


    var frameRate = Math.floor((1000 * app.CLOCK.ticks / (new Date() - new Date(app.splitTime))));
    var hoursPerTick = app.physics.constants.EARTH_HOURS_PER_TICK_AT_TIME_STEP_1 * app.physics.variables.TIME_STEP_INTEGRATOR;
    var daysPerSecond = frameRate * (hoursPerTick / 24);
    this.appendLine("Simulation Speed: " + app.physics.variables.TIME_STEP);

    if (hoursPerTick > 1) {
      this.appendLine("    Hours Per Tick: " + Math.floor(hoursPerTick * 10) / 10);
      this.appendLine("    Days Per Second: " + Math.floor(daysPerSecond));
    } else if ( hoursPerTick > 0.0166) {
      this.appendLine("    Minutes Per Tick: " + Math.floor(60 * hoursPerTick * 10) / 10);
      this.appendLine("    Hours Per Second: " + Math.floor(daysPerSecond * 24));
    } else {
      this.appendLine("    Seconds Per Tick: " + Math.floor(3600 * hoursPerTick * 10) / 10);
      this.appendLine("    Minutes Per Second: " + Math.floor(daysPerSecond * 1440));
    }
    this.appendLine("Ticks: " + app.CLOCK.ticks);
    this.appendLine("    Total Days: " + Math.floor((hoursPerTick / 24) * app.CLOCK.ticks));    
    this.appendLine("    FrameRate: " + frameRate);

    if (this.focusParticle) {
      var focusKE = Math.round(this.focusParticle.kineticE()*100000,0) === 0 ? Math.round(this.focusParticle.kineticE()*1000000000,0) / 10000 : Math.round(this.focusParticle.kineticE()*100000,0);
      this.appendLine("Following: " + this.focusParticle.name);
      this.appendLine("     Energy: " + focusKE);
      this.appendLine("     Speed: " + Math.round(app.physics.getParticleSpeed(this.focusParticle) * 1000, 0));
      this.appendLine("     Direction: " + Math.round(this.focusParticle.direction, 0));
      this.appendLine("        retro direction: " + Math.round(this.focusParticle.direction - 180, 0));
      this.appendLine("     Mass: " + this.focusParticle.mass);
    }

    var viewPort = app.physics.convertViewPortPixelsToUnits(app.viewPort.viewPortSize);
    this.appendLine("Viewport size: " + viewPort.size + viewPort.unit);
    this.appendLine("Click Action: " + app.response.MODE);

    var totalMass = 0,
      totalEnergy = 0;

    for(var zz = 0; zz < app.particles.length; zz++) {
      totalMass += app.particles[zz].mass;
      totalEnergy += app.particles[zz].kineticE()*100000;
    }

    totalMass = Math.round(totalMass*1000,0) / 1000;
    totalEnergy = Math.round(totalEnergy*100000,0);

    this.appendLine("Total system mass: " + totalMass);
    this.appendLine("Total system energy: " + totalEnergy);
    this.appendLine("Total collisions: " + app.collisions);
    this.appendLine("Potential collisions: ");
    this.appendLine("----------------------");

    var lastBucket = null;
    for (var bucket in app.potentialCollisions) {
      var num = Number(bucket) / 100;
      if (lastBucket) {
        var list = app.potentialCollisions[lastBucket];
        if (list.length) {
          this.appendLine("Items between " + (lastBucket / 100) + " and " + num + " apart: ");

          // BROKEN
          for (var pair in list) {
            var a = app.particles[list[pair][0]];
            var b = app.particles[list[pair][1]];
            this.appendLine("    " + a.name + " and " + b.name);
          }
          // BROKEN
        }
      }

      lastBucket = bucket;
    }
    this.appendLine("----------------------");
    // var maxMass = 0;
    // for(var xx = 0; xx < app.particles.length; xx++) {
    //   if(app.particles[xx].mass > maxMass) {
    //     maxMass = app.particles[xx].mass;
    //   }
    // }

    // this.appendLine("Most Massive: " + maxMass);

    //var closestDist = app.physics.convertViewPortPixelsToUnits(app.closestPair.d);
    //this.appendLine("Closest Pair:   x - " + app.closestPair.x.name + " y -" + app.closestPair.y.name + " d -" + closestDist.size + closestDist.unit);
    //app.closestPair.d = 1000000;

  }
};

ViewPort.prototype.showRocketTelemetry = function() {
    var focusParticle = app.particles[this.focusId];
    var focusKE = Math.round(focusParticle.kineticE()*100000,0) === 0 ? Math.round(focusParticle.kineticE()*1000000000,0) / 10000 : Math.round(focusParticle.kineticE()*100000,0);
    this.appendLine("Following: " + focusParticle.name);
    this.appendLine("     Energy: " + focusKE);
    this.appendLine("     Speed: " + Math.round(app.physics.getParticleSpeed(focusParticle) * 1000, 0));
    this.appendLine("     Direction: " + Math.round(focusParticle.direction, 0));
    this.appendLine("        retro direction: " + Math.round(focusParticle.direction - 180, 0));
    this.appendLine("     Mass: " + focusParticle.mass);

    this.appendLine("   targeting: " + app.particles[3].name);
    this.appendLine("     target speed: " + Math.round(app.physics.getParticleSpeed(app.particles[3]) * 1000, 0));
    this.appendLine("     target direction: " + Math.round(app.particles[3].direction, 0));
    var solPosition = app.particles[0].position.asXYZ();
    var d3Sol = Math.round(focusParticle.dist(app.particles[0]) / app.physics.constants.ASTRONOMICAL_UNIT * 500);
    var earthPosition = app.particles[3].position.asXYZ();
    var d3Target = Math.round(focusParticle.dist(app.particles[3]) / app.physics.constants.ASTRONOMICAL_UNIT * 500);
    this.appendLine("     d(SOL): " + (d3Sol / 500));
    this.appendLine("     d(TAR): " + (d3Target / 500));

    this.appendLine("Thrust:    H: " + app.thrust.heading + " E: " + app.thrust.thrust + " B: " + app.thrust.burning);
    this.appendLine("Thrust Vector: " + app.thrust.getThrustVector().x + " | " + app.thrust.getThrustVector().y);
};

ViewPort.prototype.appendLine = function(txt) {
  app.ctx.fillText(txt, 5, this.txtOffset);
  this.txtOffset += this.lineHeight;
};

ViewPort.prototype.integrateWrapper = function() {
  /*if(app.physics.variables.TIME_STEP != 1) {
    app.physics.constants.GRAVITY_CONSTANT /= app.physics.variables.TIME_STEP;
  }*/

  app.resetPotentialCollisions();

  app.physics.leapFrog();
  app.physics.handleCollisions();

  Particles.prototype.freeTheDestroyed();

};


ViewPort.prototype.setClock = function() {
  app.CLOCK.ticks += 1;

  if(app.CLOCK.ticks > 1000000) {
    app.CLOCK.ticks = 0;
  }
};

ViewPort.prototype.setIntegrate = function() {
  this.setAxes(this.viewAngle, this.viewPhi);
  if (this.setFocus()){
    app.viewPort.drawParticles();
  }
};


ViewPort.prototype.adjustZoom = function(direction) {
  var nearZero = this.shift.zoom < .0001 && this.shift.zoom > -.0001;
  if(nearZero === true) {
    this.shift.zoom = 0;

    if(direction === 'in') {
      this.shift.zoom = 0.5;
    }
    if(direction === 'out') {
      this.shift.zoom = -0.015625;
    }

    return;
  }

  if(direction === 'in') {
    if(this.shift.zoom > 0) {
      this.shift.zoom = this.shift.zoom * 2;
    } else {
      this.shift.zoom = -1 - ((-1 - this.shift.zoom) * 4 / 3);
    }
  } else {
    if(this.shift.zoom > 0) {
      this.shift.zoom = this.shift.zoom / 2;
    } else {
      this.shift.zoom = -1 - ((-1 - this.shift.zoom) * 3 / 4);
    }
    
  }

  if(this.shift.zoom <= -0.99995) {
    this.shift.zoom = -0.99995;
  } 

  if(this.shift.zoom !== -1) {
    app.viewPort.viewPortSize = (app.width / (1 + this.shift.zoom)) / app.physics.constants.ASTRONOMICAL_UNIT;
    app.viewPort.viewPortSizeInKm = app.physics.constants.KM_PER_AU * app.viewPort.viewPortSize;  
  }
};


module.exports = ViewPort;
},{"./vector3d":7}]},{},[2]);
