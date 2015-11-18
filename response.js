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

function Response() {
  app.eventListener.addEventListener('mousemove', this.onMousemove);
  app.eventListener.addEventListener('click', this.onClick);
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

Response.prototype.onKeyDown = function(e, ref) {
  app.response.eventHandle = this.onKeyDown;
  if(app.response.CommandMode === 'COMMAND') {
    app.response.handleCommand(e);
  } else {
    //app.response.handleConsole(e);
  }

  return false;
};

Response.prototype.onClick = function(e) {
  var xy = {x: e.clientX, y: e.clientY};

  if(app.response.MODE === 'FOLLOW') {
    app.response.follow(xy);
  } else if(app.response.MODE === 'DESTROY') {
    app.response.destroy(xy);
  } else {
    app.response.rocket();
  }
};

Response.prototype.onMousemove = function(e) {
  var up = app.mouse.y > e.clientY;
  var right = app.mouse.x > e.clientX;
  
  app.viewPort.viewAngle = up ? app.viewPort.viewAngle + Math.PI / 128 : app.viewPort.viewAngle - Math.PI / 128;
  app.viewPort.viewPhi   = right? app.viewPort.viewPhi - Math.PI / 64 : app.viewPort.viewPhi + Math.PI / 64;

  if(app.viewPort.viewAngle < 0) {
    app.viewPort.viewAngle = 0;
  }
  if(app.viewPort.viewAngle > Math.PI) {
    app.viewPort.viewAngle = Math.PI;
  }

  if (app.viewPort.viewPhi > 2 * Math.PI){
    app.viewPort.viewPhi -= 2*Math.PI;
  }else if (app.viewPort.viewPhi < -2 * Math.PI){
    app.viewPort.viewPhi += 2*Math.PI;
  }
  app.mouse.x = e.clientX;
  app.mouse.y = e.clientY;
};

Response.prototype.onMouseWheel = function(e){
  if (e.deltaY > 0){
    app.viewPort.adjustZoom('out');
  }else{
    app.viewPort.adjustZoom('in');
  }
  return false;
}

Response.prototype.handleCommand = function(e) {
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
}

Response.prototype.handleConsole = function(e) {
  app.textParser.handleConsole();
}

Response.prototype.onCommandExit = function() {
  app.response.CommandMode = 'COMMAND';
  app.display.focus();
  app.eventListener.addEventListener("keydown", app.response.eventHandle);

  app.toggleConsoleVisibility(false);
}


Response.prototype.switchCommandMode = function() {
  app.response.CommandMode = 'shell';
  app.eventListener.removeEventListener("keydown", app.response.eventHandle);

  app.toggleConsoleVisibility(true);
  shellJs.init(app.console, app.response.onCommandExit, app.response.commands, true, { keyCode: 192, displayText: "~ or `" } );
}

Response.prototype.changeMode = function() {
  if(app.response.MODE === 'FOLLOW') {
    app.response.MODE = 'ROCKET';
  } else if( this.MODE === 'ROCKET') {
    app.response.MODE = 'PHOTON';
  } else if( this.MODE === 'PHOTON') {
    app.response.MODE = 'DESTROY';
  } else {
    app.response.MODE = 'FOLLOW';
  }
};

Response.prototype.speedUp = function() {
  if(app.physics.variables.TIME_STEP < 100) {
    app.physics.updateTimeStep(app.physics.variables.TIME_STEP * 2);
  }
}

Response.prototype.follow = function(xy){
    app.FOLLOW = Response.prototype.getNearest(xy);
};

Response.prototype.input = function() {
  app.CURSOR = true;  
  app.GO = false;
};

Response.prototype.getNearest = function(clickXY){
  //Perform this in viewport coordinates.
  //It's viewport's job to furnish the viewport coordinates of any object of interest.
  var jXY, dx, dy,
  indexClosest = 0, j,
  dSqClosest   = Number.MAX_VALUE, dSq;
  
  for(j=0; j < app.particles.length; j++){
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
}

Response.prototype.destroy = function(xy){
  var currIndex = Response.prototype.getNearest(xy);

  var tmp = [];
  for(var j = 0; j < app.particles.length; j++) {
    if(j != currIndex) {
      tmp.push(app.particles[j]);
    }
  }

  app.particles = tmp;

  if(app.FOLLOW == currIndex) app.FOLLOW = 0;
};

Response.prototype.rocket = function(){
  var x = new Particles().buildParticle({name: 'ROCKET!! ' + app.particles.length, mass: 1/ 1500000000, radius: 10, orbitalVelocity: 0.08 - Math.random() * .08, arc: Math.PI / 2, distance: app.physics.constants.ASTRONOMICAL_UNIT * 2, drawSize: .1}),
    newGuy = app.particles[app.particles.length -1];

  if(app.response.MODE === 'PHOTON') {
    newGuy.name = 'PHOTON' + app.particles.length;
    newGuy.mass = 0;
    var arc = 0;//Math.random() * 2 * Math.PI;
    
    newGuy.position.setFromV(app.particles[0].position);
    newGuy.vel.setXYZ(5000 * Math.cos(arc),
                          5000 * Math.sin(arc), 
                        0.);

  } else {
    newGuy.position.setFromV(app.particles[app.FOLLOW].position);
    newGuy.position.increment(Vector3d.prototype.randomOfMagnitude(0.3));

    newGuy.vel.setFromV(app.particles[app.FOLLOW].vel);
    newGuy.vel.increment(Vector3d.prototype.randomOfMagnitude(0.0003 * Math.random()));
    app.FOLLOW = app.particles.length - 1;
  }
  
  app.PARTICLECOUNT = app.particles.length - 1;

    // if(app.particles.PARTICLECOUNT > 30) {
    //   var tmp = [];
    //   for(var j = 0; j < app.particles.length; j++) {
    //     if(j != 13) {
    //       tmp.push(app.particles[j]);
    //     }
    //   }

    //   app.particles = tmp;
    // }
};

Response.prototype.reset = function() {
  if(app.physics.variables.CALC_STYLE !== 'real') {
    app.physics.variables.CALC_STYLE = 'real';
  } else {
    app.physics.variables.CALC_STYLE = 'wacky';
    //app.physics.variables.CALC_STYLE_VELOCITY_MOD = Math.floor(Math.random() * 10) + 1;
  }
  app.ctx.clearRect(0, 0, app.width, app.height);
  var x = new Particles().buildInitialParticles();
  app.viewPort.colorSorted = false;
  app.CLOCK.ticks = 0;
  app.CLOCK.e = 0;
  app.CLOCK.j = 0;
  app.CLOCK.n = 0;
  app.collisions = 0;

  app.resetPotentialCollisions();
}

Response.prototype.pause = function() {
  //app.physics.updateTimeStep(1);
  if(app.GO === false) {
    app.GO = true;
    requestAnimationFrame(app.viewPort.frame);
    app.CLOCK.ticks = 0;
    app.splitTime = new Date();
  } else {
    app.GO = false;
  }
}

Response.prototype.changeView = function() {
  app.viewPort.cycleState();
  app.ctx.font="12px Calibri";
  app.ctx.clearRect(0, 0, app.width, app.height);  
}

Response.prototype.incrementFollow = function () {
  app.FOLLOW += 1;
  app.viewPort.shift.x = 0;
  app.viewPort.shift.y= 0;
  if(app.FOLLOW >= app.particles.length) {
    app.FOLLOW = 0;
  }
}

Response.prototype.changeProperty = function(id, propName, newValue) {
  app.particles[id][propName] = newValue;
}

Response.prototype.addParticle = function(massX, radX, eC, arc, name) {
  var eccentricity = eC == null ? 1 : eC / 100,
    radians = arc == null ? Math.random() * 2 * Math.PI : arc,
    text = name == null ? 'planet-X' : name;
  var cfg = {name: text, mass: massX / 100, radius: 1097, 
      orbits: [{mass: 1047 * eccentricity, radius: radX * 5}], arc: radians, drawSize: 1};
  var x = new Particles().buildParticle(cfg);
  return x;
}

Response.prototype.addCloud = function(cnt, rC, rF) {
  var x = new Particles();

  for(var y = 0; y < cnt; y++) {
    var rad = rC * 5 + (Math.random() * (rF - rC)) * 5;
    var cfg = {name: 'cloud-' + y, mass: 1 / 10000, radius: 1097, 
      orbits: [{mass: 1047 +  Math.random() * 100, radius: rad}], arc: Math.random() * 2 * Math.PI, drawSize: .1};
    x.buildParticle(cfg);
  }

  return x;
}

Response.prototype.destroyAll = function() {
  var me = this;
  app.FOLLOW = 0;
  app.particles.splice(1, app.particles.length - 1);
  app.alwaysIntegrate.splice(1, app.alwaysIntegrate.length - 1);
}

Response.prototype.resetViewToHome = function() {
  app.viewPort.shift.x = 0;
  app.viewPort.shift.y= 0;
  app.viewPort.viewAngle = .75;
  app.FOLLOW = 0;
  app.viewPort.shift.zoom = 0;
  app.physics.updateTimeStep(1);
}


function TextParser() { 
}

TextParser.prototype.handleConsole = function() {
}