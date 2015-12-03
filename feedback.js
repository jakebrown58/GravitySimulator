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

function Feedback() {
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
  app.feedback.eventHandle = this.onKeyDown;
  if(app.feedback.CommandMode === 'COMMAND') {
    app.feedback.handleCommand(e);
  } else {
    //app.feedback.handleConsole(e);
  }

  return false;
};


Feedback.prototype.onClickSplash = function(e){
  if (app.viewPort.drawState !== app.viewPort.DRAW_STATE_SPLASH){
    app.eventListener.removeEventListener('click', app.feedback.onClickSplash);
    app.eventListener.addEventListener('click', app.feedback.onClick);
    app.feedback.onClick(e);
  }
};


Feedback.prototype.onClick = function(e) {
  var xy = {x: e.clientX, y: e.clientY};

  if(app.feedback.MODE === 'FOLLOW') {
    app.feedback.follow(xy);
  } else if(app.feedback.MODE === 'DESTROY') {
    app.feedback.destroy(xy);
  } else {
    app.feedback.rocket();
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
  if(action === 'toggleCommandMode') { app.feedback.switchCommandMode(); return;}
  if(action === 'zoomOut') { app.viewPort.adjustZoom('out'); }
  if(action === 'zoomIn') { app.viewPort.adjustZoom('in'); }
  if(action === 'switchToDefaultView')  { app.feedback.resetViewToHome(); }
  if(action === 'rocketEnginesBurnToggle') { app.thrust.act(action); }
  if(action === 'rocketRotateLeft') { app.thrust.act(action); }
  if(action === 'rocketRotateRight') { app.thrust.act(action); }
  if(action === 'rocketIncreaseThrust') { app.thrust.act(action); }
  if(action === 'viewToggle') { app.feedback.changeView(); }
  if(action === 'trace') { app.TRACE = !app.TRACE; }
  if(action === 'reset') { app.feedback.reset(); }
  if(action === 'reverseTime') { app.physics.reverseTime(); }
  if(action === 'viewShiftUp') { app.viewPort.shift.y -= 5; }
  if(action === 'viewShiftDown') { app.viewPort.shift.y += 5; }
  if(action === 'viewShiftLeft') { app.viewPort.shift.x -= 5; }
  if(action === 'viewShiftRight') { app.viewPort.shift.x += 5; }
  if(action === 'switchClickAction') { app.feedback.changeMode(); }
  if(action === 'pause') { app.feedback.pause(); }
  if(action === 'visualLogging') { app.SHOWCLOCK = !app.SHOWCLOCK; }
  if(action === 'follow') { app.feedback.incrementFollow(); }
  if(action === 'speedItUp') { app.feedback.speedUp(); }
  if(action === 'slowItDown') { app.physics.updateTimeStep(app.physics.variables.TIME_STEP / 2); }
};

Feedback.prototype.handleConsole = function(e) {
  app.textParser.handleConsole();
};

Feedback.prototype.onCommandExit = function() {
  app.feedback.CommandMode = 'COMMAND';
  app.display.focus();
  app.eventListener.addEventListener("keydown", app.feedback.eventHandle);

  app.toggleConsoleVisibility(false);
};


Feedback.prototype.switchCommandMode = function() {
  app.feedback.CommandMode = 'shell';
  app.eventListener.removeEventListener("keydown", app.feedback.eventHandle);

  app.toggleConsoleVisibility(true);
  shellJs.init(app.console, app.feedback.onCommandExit, app.feedback.commands, true, { keyCode: 192, displayText: "~ or `" } );
};

Feedback.prototype.changeMode = function() {
  if (app.feedback.MODE === 'FOLLOW') {
    app.feedback.MODE = 'ROCKET';
  } else if ( this.MODE === 'ROCKET') {
    app.feedback.MODE = 'PHOTON';
  } else if ( this.MODE === 'PHOTON') {
    app.feedback.MODE = 'DESTROY';
  } else {
    app.feedback.MODE = 'FOLLOW';
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

  if(app.feedback.MODE === 'PHOTON') {
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
    app.feedback.reset();
  }
  return app.FOLLOW;
};

function TextParser() {
}

TextParser.prototype.handleConsole = function() {
};


module.exports = Feedback;
