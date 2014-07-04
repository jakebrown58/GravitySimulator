var app = {};

app.init = function() {

  app.display = document.getElementById('display');
  app.ctx = display.getContext('2d');
  app.particles = [];
  app.viewPort = new ViewPort();
  app.physics = new Physics();
  app.response = new Response();
  app.width = display.width = window.innerWidth;
  app.height = display.height = window.innerHeight;
  app.size = (app.width + app.height) / 2;
  app.halfWidth = app.width * .5;
  app.halfHeight = app.height * .5;
  app.mouse = { x: app.halfWidth, y: app.halfHeight };
  app.TRACE = false;
  app.DRAWSTATE = 1;
  app.VIEWSHIFT = {x: -50, y: 0, zoom: 0};
  app.GO = true;
  app.VIEWANGLE = .75;
  app.FOLLOW = 0;
  app.CLOCK = {j:0, e:0, n:0, ticks: 0};
  app.SHOWCLOCK = false;
  app.realTime = Date();

  app.display.focus();

  var x = new Particles().buildInitialParticles();
};

function Physics() {
  this.constants = {};
  this.constants.DAMPING = 1;
  this.constants.GRAVITY_CONSTANT = 1 / 100;   // 1500 will result in a time-step equal to about 1 earth-day.  lower is faster.
  this.constants.ORIGINAL_GRAVITY_CONSTANT = 1 / 100; // helps us get back to a base-state.
  this.constants.ORIGINAL_VELOCITY_FACTOR = 1,
  this.constants.JUPITER_MASS = 1,
  this.constants.EARTH_MASS = 1 / 317,
  this.constants.ASTRONOMICAL_UNIT = 50,  // astronomical unit / ie, 1 Earth distance from the sun.
  this.constants.MILES_PER_AU = 92560000;
  this.constants.LIGHTYEAR_PER_AU = 63239.72;
  this.constants.LIGHTYEAR = this.constants.ASTRONOMICAL_UNIT * this.constants.LIGHTYEAR_PER_AU;


  this.variables = {};
  this.variables.TIME_STEP = 1;
}

function Particles() {
  this.objects = {};
  this.objects.COMETS = 30;
  this.objects.ASTEROIDS = 300;
  this.objects.JUPITERCLOUD = 300;
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
    aU = 50,
    initalObjects = {},
    jupiterArc = Math.PI,
    cfg = {};

  initialObjects = [
    {name: 'Sun', mass: jupiterMass * 1047, radius: 0, orbitalVelocity: 0, drawSize: 3, color: {r: 255, g: 255, b: 220}},
    {name: 'Mercury', mass: earthMass * .055, orbits: [{mass: sunMass, radius: aU * .387098}], drawSize: .5},
    {name: 'Venus', mass: earthMass * .815, orbits: [{mass: sunMass, radius: aU * .72}], drawSize: 1},
    {name: 'Earth', mass: earthMass, orbits: [{mass: sunMass, radius: aU}], drawSize: 1, color: {r: 180, g: 200, b: 255}},
    {name: 'Mars', mass: earthMass * .107, orbits: [{mass: sunMass, radius: aU * 1.38}], drawSize: .6, color: {r: 255, g: 160, b: 160}},
    {name: 'Jupiter', mass: jupiterMass, orbits: [{mass: sunMass, radius: aU * 5.2}], arc: jupiterArc, drawSize: 1.4},    
    {name: 'Saturn', mass: jupiterMass * .30, orbits: [{mass: sunMass, radius: aU * 9.5}], drawSize: 1.3, color: {r: 255, g: 215, b: 165}},
    {name: 'Neptune', mass: earthMass * 17.147, orbits: [{mass: sunMass, radius: aU * 30}], drawSize: 1, color: {r: 150, g: 160, b: 215}},
    {name: 'Ganymede', mass: earthMass * .025, orbits: [{mass: sunMass, radius: aU * 5.2}, {mass: jupiterMass, radius: aU * .014}], arc: jupiterArc, drawSize: .6}
  ];

  while(initialObjects.length > 0) {
    this.buildParticle(initialObjects.shift());
  }

  for (i = 0; i < this.objects.ASTEROIDS; i++) {
    this.buildParticle({name: 'Asteroid', mass: earthMass / (8000 + Math.random() * 25000), orbits: [{mass: sunMass, eccentric: 'little', radius: aU * 1.5 + aU * Math.random() * 3.5}], drawSize: .1});
  }

  for (i = 0; i < this.objects.COMETS; i++) {
    this.buildParticle({name: 'COMET', mass: earthMass / (8000 + Math.random() * 25000), radius: aU * 7 + aU * (Math.random() * 40), orbitalVelocity: -.14 + Math.random() * 3.02, drawSize: .1});
  }  

  for (i = 0; i < this.objects.JUPITERCLOUD; i++) {
    this.buildParticle({
      name: 'Jupiter Cloud', 
      arc: jupiterArc + Math.random() * Math.PI / 160 - Math.random() * Math.PI / 80, 
      mass: earthMass / (8000 + Math.random() * 32000), 
      orbits: [
        {mass: sunMass, radius: aU * 5.2}, 
        {mass: jupiterMass, eccentric: 'little', radius: aU * .01 + aU * Math.random() * .08}], 
      drawSize: .03
    });
  }

  //this.buildParticle({name: 'LIGHTYEAR EXPRESS', mass: 1 / 500000000000000, radius: app.physics.constants.LIGHTYEAR, arc: 0, orbitalVelocity: .300, drawSize: 1});
  //app.particles[app.particles.length-1].oldX = app.particles[app.particles.length-1].x - (328 * app.physics.constants.ASTRONOMICAL_UNIT);
};

Particles.prototype.finalize = function() {
  //Find momentum of system
  var particles = app.particles,
    px = 0,
    py = 0;
    
  for (var i = 0; i < particles.length; i++) {
      var me = particles[i];
      px += me.mass * me.velx;
      py += me.mass * me.vely;
  }
  //Give the Sun a little kick to zero out the system's momentum:
  var sun = app.particles[0];
  sun.velx += -px / sun.mass;
  sun.vely += -py / sun.mass;

  //This has to be done once before integration can occur. Prime The Pump!
  for (var i = 0; i < app.particles.length; i++) {
    app.particles[i].calcAcceleration();
  }

  app.PARTICLECOUNT = particles.length -1;
};

Particles.prototype.buildParticle = function(cfg) {
    var tmp = new Particle();
    tmp.configure(cfg);
    app.particles.push(tmp);
};

function Particle(id, x, y) {
  this.id = id; 
  this.x = this.oldX = x;
  this.y = this.oldY = y;
  this.remove = false;

  this.oldX = x + Math.random() * 8 - 4;
  //this.oldY = y + Math.random() * 8 - 4;

  this.mass = 2;

  this.damping = 1;
  this.color = {r: Math.floor(Math.random() * 100 + 155), 
    g:  Math.floor(Math.random() * 200 + 145), 
    b:  Math.floor(Math.random() * 100 + 155)};
}

Particle.prototype.calcAcceleration = function(){
 var curr,
    dx,
    dy,
    grav;

    this.oldaccx = this.accx
    this.oldaccy = this.accy


    this.accx = 0.0;
    this.accy = 0.0;

    for (var i = 0; i < app.particles.length; i++) {
    curr = app.particles[i];
    if(curr.id !== this.id ) {
      dx = curr.x - this.x;
      dy = curr.y - this.y;
      var d2 = dx * dx + dy * dy;
      var d3 = Math.sqrt(d2) * d2;

      grav = curr.mass * app.physics.constants.GRAVITY_CONSTANT / d3;

      if(d2 > 0) {
        this.accx += grav * dx;
        this.accy += grav * dy;
      }else{
        //whoodeedoo.
      }
    }
  }
}

Particle.prototype.updatePosition = function() {
  var dt = app.physics.variables.TIME_STEP; //dummy, to hook up to real dt later.
  this.x = this.x + this.velx * dt + 0.5 *this.accx * dt*dt;
  this.y = this.y + this.vely * dt + 0.5 *this.accy * dt*dt;
};

Particle.prototype.updateVelocity = function() {
  var dt = app.physics.variables.TIME_STEP; //dummy, to hook up to real dt later.
  this.velx = this.velx + 0.5 * (this.oldaccx + this.accx) * dt;
  this.vely = this.vely + 0.5 * (this.oldaccy + this.accy) * dt;
};



Particle.prototype.checkClock = function() {
    return this.x > app.halfWidth && this.y < app.halfHeight && this.newY > app.halfHeight;
};

Particle.prototype.attract = function(x, y) {
  var dx = x - this.x;
  var dy = y - this.y;
  var distance = .82 * Math.sqrt(dx * dx + dy * dy) * this.mass;
  //this.x += dx / distance;
  //this.y += dy / distance;
};

Particle.prototype.explode = function(x, y) {
  var base = 20 - (this.mass / 2);
  var velModX = (Math.random() * base - base / 2);
  var velModY = (Math.random() * base - base / 2);
  var velocityX = (this.x - this.oldX) + velModX;
  var velocityY = (this.y - this.oldY) + velModY;
  this.oldX = this.x;
  this.oldY = this.y;
  this.x += velocityX;
  this.y += velocityY;
};

Particle.prototype.configure = function(config) {
  var particle = this,
    localOrbitalVelocity = 0,
    localRadius = config.radius || 0;

  if(config.arc === undefined) {
    config.arc = Math.random() * 6.28;
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
      }
    }
  } else {
    localOrbitalVelocity = config.orbitalVelocity * app.physics.constants.ORIGINAL_VELOCITY_FACTOR;
  }

  particle.mass = config.mass;
  particle.x = app.halfWidth - localRadius * Math.cos(config.arc);
  particle.y = app.halfHeight - localRadius * Math.sin(config.arc);

  particle.velx = localOrbitalVelocity * Math.sin(config.arc);
  particle.vely = localOrbitalVelocity * -Math.cos(config.arc);

  particle.accx = 0.0;
  particle.accy = 0.0;

  particle.size = config.drawSize;    
  particle.drawColor = '#' + this.color.r.toString(16) + this.color.g.toString(16) + this.color.b.toString(16);
};

Particle.prototype.draw = function() {
  var ctx = app.ctx,
    obj,
    center = {x: (app.particles[app.FOLLOW].x - app.width / 2), y: (app.particles[app.FOLLOW].y - app.height / 2)};

  if(app.DRAWSTATE === 0) {
    obj = app.viewPort.project(this.x, this.y, 0);
  } else {
    obj = {x: this.x, y: this.y};
    obj.x = (this.x - center.x) + (this.x - app.particles[app.FOLLOW].x) * app.VIEWSHIFT.zoom;
    obj.y = (this.y - center.y) + (this.y - app.particles[app.FOLLOW].y) * app.VIEWSHIFT.zoom;
  }


  ctx.strokeStyle = this.drawColor;
  ctx.lineWidth = this.size;
  ctx.beginPath();
  ctx.arc(obj.x, obj.y, ctx.lineWidth, 0, 2 * Math.PI, false);
  ctx.fillStyle = ctx.strokeStyle;
  ctx.fill();
  ////ctx.moveTo(this.oldX, this.oldY);
  //ctx.lineTo(this.x + 1, this.y + 1);
  ctx.stroke();
};

/* ******************* VIEWPORT ******************************************************* */

function ViewPort(){
  this.frameCount = 0;
  this.draw = true;
}

ViewPort.prototype.project = function(flatX, flatY, flatZ) {
  var point = app.viewPort.iso(flatX, flatY);
  var x0 = app.width * 0.5;
  var y0 = app.height * 0.2;
  var z = app.size * 0.5 - flatZ + point.y * Math.sin(app.VIEWANGLE);
  var x = (point.x - app.size * 0.5) * 6;
  var y = (app.size - point.y) * 0.005 + 1;

  return {
    x: app.VIEWSHIFT.x + x0 + x / y,
    y: app.VIEWSHIFT.y + y0 + z / y
  };
};

ViewPort.prototype.iso = function(x, y) {
  return {
    x: 0.5 * (app.size + x - y),
    y: 0.5 * (x + y)
  };
};

ViewPort.prototype.frame = function() {
  var current;

  if(app.GO) {
    requestAnimationFrame(app.viewPort.frame);
  }
  if(!app.TRACE) {
    app.ctx.clearRect(0, 0, app.width, app.height);
  }

  if(app.SHOWCLOCK) {
    app.ctx.fillText("Earth time:" + app.CLOCK.e, 5, 25);
    app.ctx.fillText("Jupiter time:" + app.CLOCK.j, 5, 45);
    app.ctx.fillText("Neptune time:" + app.CLOCK.n, 5, 65);
    app.ctx.fillText("Started:" + app.realTime, 5, 85);
    app.ctx.fillText("Now:" + Date(), 5, 105);
    app.ctx.fillText("Ticks: " + app.CLOCK.ticks, 5, 125);
    // app.ctx.fillText("Vx: " + (app.particles[app.FOLLOW].newX - app.particles[app.FOLLOW].oldX) * 100, 5, 145);
    // app.ctx.fillText("Vy: " + (app.particles[app.FOLLOW].newY - app.particles[app.FOLLOW].oldY) * 100, 5, 165);
    // app.ctx.fillText("Gx: " + (app.particles[app.FOLLOW].gravVector.x) * 100, 5, 185);    
    // app.ctx.fillText("Gy: " + (app.particles[app.FOLLOW].gravVector.y) * 100, 5, 205);    
    app.ctx.fillText("G: " + app.physics.constants.GRAVITY_CONSTANT, 5, 225);

    var viewPortSize = (app.width / (app.VIEWSHIFT.zoom + 1)) / app.physics.constants.ASTRONOMICAL_UNIT,
      unit = ' AU';
    if(viewPortSize >= app.physics.constants.LIGHTYEAR_PER_AU) {
      viewPortSize = viewPortSize / app.physics.constants.LIGHTYEAR_PER_AU;
      unit = ' LIGHTYEARS';
    } else if(viewPortSize < 1) {
      viewPortSize = Math.floor(viewPortSize * app.physics.constants.MILES_PER_AU);
      unit = ' MILES';
    } else if( viewPortSize > 4) {
      viewPortSize = Math.floor(viewPortSize);
    }
    app.ctx.fillText("Viewport size: " + viewPortSize + unit, 5, 245);
  }


  for (var i = 0; i < app.particles.length; i++) {
    app.particles[i].updatePosition();
  }
  for (var i = 0; i < app.particles.length; i++) {
    app.particles[i].calcAcceleration();
  }
  for (var i = 0; i < app.particles.length; i++) {
    app.particles[i].updateVelocity();
  }


  app.CLOCK.ticks += 1;
  app.CLOCK.e += app.particles[3].checkClock() ? 1 : 0;
  app.CLOCK.j += app.particles[5].checkClock() ? 1 : 0;
  app.CLOCK.n += app.particles[7].checkClock() ? 1 : 0; 

  for (i = 0; i < app.particles.length; i++) {
    app.particles[i].draw();
  }
};

// ViewPort.prototype.adjustView = function(direction) {
// };

ViewPort.prototype.adjustZoom = function(direction) {
    if( app.VIEWSHIFT.zoom < .0001 && app.VIEWSHIFT.zoom > -.0001) {
      app.VIEWSHIFT.zoom = 0;

      if(direction === 'in') {
        app.VIEWSHIFT.zoom = .5;
      }
      if(direction === 'out') {
        app.VIEWSHIFT.zoom = -.015625;
      }

      return;
    }

    if(direction === 'in') {
      if(app.VIEWSHIFT.zoom > 0) {
        app.VIEWSHIFT.zoom = app.VIEWSHIFT.zoom * 2;
      } else {
        app.VIEWSHIFT.zoom = app.VIEWSHIFT.zoom + .015625;
      }
    } else {
      app.VIEWSHIFT.zoom -= .015625;

      if(app.VIEWSHIFT.zoom > 1) {
        app.VIEWSHIFT.zoom = app.VIEWSHIFT.zoom / 2;
      }
    }

    if(app.VIEWSHIFT.zoom <= -1) {
      app.VIEWSHIFT.zoom = -.9995;
    } 
};

/* ******************* RESPONSE ******************************************************* */

function Response() {
  app.display.addEventListener('mousemove', this.onMousemove);
  //app.display.addEventListener('click', this.onClick);
  app.display.addEventListener('keydown', this.onKeyDown);
}

Response.prototype.onMouseMove = function() {
    var up = app.mouse.y > e.clientY;

    app.VIEWANGLE = up ? app.VIEWANGLE + Math.PI / 32 : app.VIEWANGLE - Math.PI / 32;

    if(app.VIEWANGLE < 0) {
      app.VIEWANGLE = 0;
    }
    if(app.VIEWANGLE > Math.PI / 2) {
      app.VIEWANGLE = Math.PI / 2;
    }

    app.mouse.x = e.clientX;
    app.mouse.y = e.clientY;
};

Response.prototype.onKeyDown = function(e) {
    if(e.keyCode === 86) {    // v
      app.DRAWSTATE += 1;

      if(app.DRAWSTATE === 3) {
        app.DRAWSTATE = 0;
      }
      app.ctx.clearRect(0, 0, app.width, app.height);
    }
    if(e.keyCode === 32) {    // ' '
      app.TRACE = !app.TRACE;
    }
    if(e.keyCode === 87) {    // 'W'
      app.VIEWSHIFT.y -= 3;
    }
    if(e.keyCode === 83) {    // 'S'
      app.VIEWSHIFT.y += 3;
    }
    if(e.keyCode === 65) {    // 'A'
      app.VIEWSHIFT.x -= 3;
    }
    if(e.keyCode === 80) {    // 'P'
      app.physics.variables.TIME_STEP = 1;
      if(app.GO === false) {
        app.GO = true;
        requestAnimationFrame(app.viewPort.frame);
        app.CLOCK.ticks = 0;
      } else {
        app.GO = false;
      }
    }
    if(e.keyCode === 68) {    // 'D'
      app.VIEWSHIFT.x += 3;
    }    
    if(e.keyCode === 67) {    // 'C'
      app.SHOWCLOCK = !app.SHOWCLOCK;
    }        
    if(e.keyCode === 70) {    // 'F'
      app.FOLLOW += 1;
      if(app.FOLLOW >= app.PARTICLECOUNT) {
        app.FOLLOW = 0;
      }
    } 
    if(e.keyCode === 88) {    // 'X'
      if(app.physics.variables.TIME_STEP < 100) {
        app.physics.variables.TIME_STEP *= 1.5;
      }
    }
    if(e.keyCode === 90) {    // 'Z'
      app.physics.variables.TIME_STEP /= 1.5;
    }

    if(e.keyCode === 82) {    // 'R'
      app.physics.variables.TIME_STEP *= -1;
    }

    if(e.keyCode === 188) {    // '<'
      app.viewPort.adjustZoom('out');
    }
    if(e.keyCode === 190) {    // '>'
      app.viewPort.adjustZoom('in');
    }    
    if(e.keyCode === 72) {    // 'H'
      app.VIEWSHIFT.x = 0;
      app.VIEWSHIFT.y= 0;
      app.VIEWANGLE = .75;
      app.FOLLOW = 0;
      app.VIEWSHIFT.zoom = 0;
      app.physics.variables.TIME_STEP = 1;
    }  
};

// Response.prototype.onClick = function(e) {
//     //app.TRACE = !app.TRACE;

//     //app.particles.push(new Particle(particles.length - 1, Math.random() * width, Math.random() * height));

//     //for(var j = 0; j < app.particles.length; j++ ) {
//     //  if(app.particles[j].id === 0){
          
//         //particles[j].x = e.clientX;
//         //particles[j].y = e.clientY;
//     //  }

//       //particles[j].explode();
//     //}
//     // for (var i = 0; i < particles.length; i++) {
//     //   particles[i].explode();
//     // }
// };


app.init();
requestAnimationFrame(app.viewPort.frame);
