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
  app.VIEWANGLE = .75;
  app.FOLLOW = 0;
  app.CLOCK = {j:0, e:0, n:0};
  app.SHOWCLOCK = false;
  app.realTime = Date();

  app.display.focus();

  var x = new Particles().buildInitialParticles();
};

function Physics() {
  this.constants = {};
  this.constants.DAMPING = 1;
  this.constants.GRAVITY_CONSTANT = 1 / 200.;
  this.constants.JUPITER_MASS = 1,
  this.constants.EARTH_MASS = 1 / 317,
  this.constants.ASTRONOMICAL_UNIT = 50, // astronomical unit / ie, 1 Earth distance from the sun.
  this.constants.LIGHTYEAR = this.constants.ASTRONOMICAL_UNIT * 63239.72;
}

function Particles() {
  this.objects = {};
  this.objects.COMETS = 300;
  this.objects.ASTEROIDS = 10;
  this.objects.JUPITERCLOUD = 30;
  this.objects.PARTICLECOUNT = 1;  
}

Particles.prototype.buildInitialParticles = function() {
  var width = app.halfWidth,
    height = app.halfHeight,
    particles = app.particles,
    jupiterMass = 1,
    earthMass = 1/317,
    aU = 50,
    initalObjects = {},
    cfg = {};

  initialObjects = [
    {name: 'Sun', mass: jupiterMass * 1047, radius: 0, orbitalVelocity: 0, drawSize: 3, color: {r: 255, g: 255, b: 220}},
    {name: 'Mercury', mass: earthMass * .055, radius: aU * .387098, orbitalVelocity: 2.18, drawSize: .5},
    {name: 'Venus', mass: earthMass * .815, radius: aU * .72, orbitalVelocity: 2.1, drawSize: 1},
    {name: 'Earth', mass: earthMass, radius: aU, orbitalVelocity: 2.18, drawSize: 1, color: {r: 180, g: 200, b: 255}},
    {name: 'Mars', mass: earthMass * .107, radius: aU * 1.38, orbitalVelocity: 2.19, drawSize: .6, color: {r: 255, g: 160, b: 160}},
    {name: 'Jupiter', mass: jupiterMass, radius: aU * 5.2, arc: Math.PI, orbitalVelocity: 2.32, drawSize: 1.4},    
    {name: 'Saturn', mass: jupiterMass * .30, radius: aU * 9.5, orbitalVelocity: 2.28, drawSize: 1.3, color: {r: 255, g: 215, b: 165}},
    {name: 'Neptune', mass: earthMass * 17.147, radius: aU * 30, orbitalVelocity: 2.28, drawSize: 1, color: {r: 150, g: 160, b: 215}},
    {name: 'Ganymede', mass: earthMass * .025, radius: aU * 5.21, arc: Math.PI, orbitalVelocity: 2.32 + .0665, drawSize: .6}
  ];

  while(initialObjects.length > 0) {
    this.buildParticle(initialObjects.shift());
  }

  for (i = 0; i < this.objects.ASTEROIDS; i++) {
    this.buildParticle({name: 'Asteroid', mass: earthMass / (8000 + Math.random() * 25000), radius: aU + aU * (Math.random() * 8), orbitalVelocity: 2.32, drawSize: .1});
  }

  for (i = 0; i < this.objects.COMETS; i++) {
    this.buildParticle({name: 'COMET', mass: earthMass / (8000 + Math.random() * 25000), radius: aU * 5 + aU * (Math.random() * 220), orbitalVelocity: -.14 + Math.random() * 3.02, drawSize: .1});
  }  

  for (i = 0; i < this.objects.JUPITERCLOUD; i++) {
    this.buildParticle({name: 'Jupiter Cloud', mass: earthMass / (8000 + Math.random() * 32000), radius: aU * 5.2 + Math.random() * .5, arc: Math.PI, orbitalVelocity: 2.323 + Math.random() * .09, drawSize: .03});
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
      px += me.mass * (me.x - me.oldX);
      py += me.mass * (me.y - me.oldY);
  }
  //Give the Sun a little kick to zero out the system's momentum:
  var sun = app.particles[0];
  sun.oldX += px / sun.mass;
  sun.oldY += py / sun.mass;

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

Particle.prototype.integrate = function() {
  var velocityX = (this.x - this.oldX),// * this.damping,
    velocityY = (this.y - this.oldY),// * this.damping,
    curr,
    gravVector,
    dx,
    dy,
    distance,
    grav;

  gravVector = {x: 0.000, y: 0.000};
  for (var i = 0; i < app.particles.length; i++) {
    curr = app.particles[i];
    if(curr.id !== this.id ) { //&& !this.remove) {
      dx = curr.x - this.x,
      dy = curr.y - this.y,
      distance_sq = dx * dx + dy * dy;
      
      grav = curr.mass * app.physics.constants.GRAVITY_CONSTANT / distance_sq;

      if(distance_sq > 0) {
        gravVector.x += grav * dx;
        gravVector.y += grav * dy;
      } else {
        gravVector.x += 0;
        gravVector.y += 0;
      }

    // collision detection causes merging of particles with additive mass.
    // if(distance < 6 && (particles[i].id !== 0) && (this.id !== 0) && particles.length > 10 && particles[i].mass + this.mass < 24) {
    //   gravVector.x += 0;
    //   gravVector.y += 0;
    //   if(!particles[i].remove) {
    //     particles[i].remove = true;
    //     this.mass += particles[i].mass;
    //     particles[i].mass = .000001;
    //     particles[i].color = {r: 1, g: 1, b: 1};
    //     velocityX = velocityX / 2;
    //     velocityY = velocityY / 2;
    //   }
    //   if(this.mass > 1) {
    //     this.damping = 1;
    //   }
    // }
    }
  }

  this.newX = this.x + velocityX + gravVector.x;
  this.newY = this.y + velocityY + gravVector.y;
  this.oldX = this.x;
  this.oldY = this.y;
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
  var particle = this;
  if(config.arc === undefined) {
    config.arc = Math.random() * 6.28;
  }
  if(config.color) {
    particle.color = config.color;
  }
  if(config.id === undefined) {
    particle.id = app.particles.length;
  }

  particle.mass = config.mass;
  particle.x = app.halfWidth - config.radius * Math.cos(config.arc);
  particle.y = app.halfHeight - config.radius * Math.sin(config.arc);
  particle.oldX = particle.x - config.orbitalVelocity * Math.sin(config.arc);
  particle.oldY = particle.y - config.orbitalVelocity * -Math.cos(config.arc);
  particle.size = config.drawSize;    
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


  ctx.strokeStyle = '#' + this.color.r.toString(16) + this.color.g.toString(16) + this.color.b.toString(16);
  ctx.lineWidth = this.size;
  ctx.beginPath();
  ctx.arc(obj.x, obj.y, ctx.lineWidth, 0, 2 * Math.PI, false);
  ctx.fillStyle = ctx.strokeStyle;
  ctx.fill();
  ////ctx.moveTo(this.oldX, this.oldY);
  //ctx.lineTo(this.x + 1, this.y + 1);
  ctx.stroke();
};

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
  requestAnimationFrame(app.viewPort.frame);
  if(!app.TRACE) {
    app.ctx.clearRect(0, 0, app.width, app.height);
  }

  if(app.SHOWCLOCK) {
    app.ctx.fillText("Earth time:" + app.CLOCK.e, 5, 25);
    app.ctx.fillText("Jupiter time:" + app.CLOCK.j, 5, 45);
    app.ctx.fillText("Neptune time:" + app.CLOCK.n, 5, 65);
    app.ctx.fillText("Started:" + app.realTime, 5, 85);
    app.ctx.fillText("Now:" + Date(), 5, 105);
  }

  for (var i = 0; i < app.particles.length; i++) {
    app.particles[i].integrate();
  }

  app.CLOCK.e += app.particles[3].checkClock() ? 1 : 0;
  app.CLOCK.j += app.particles[5].checkClock() ? 1 : 0;
  app.CLOCK.n += app.particles[7].checkClock() ? 1 : 0; 

  for (i = 0; i < app.particles.length; i++) {
    current = app.particles[i];
    current.x = current.newX;
    current.y = current.newY;
    current.draw();
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
      app.VIEWSHIFT.zoom = app.VIEWSHIFT.zoom * 2;
    } else {
      app.VIEWSHIFT.zoom -= .015625;
    }

    if(app.VIEWSHIFT.zoom <= -1) {
      app.VIEWSHIFT.zoom = -.9995;
    } 
};

function Response() {
  app.display.addEventListener('mousemove', this.onMousemove);
  app.display.addEventListener('click', this.onClick);
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
    }  
};

Response.prototype.onClick = function(e) {
    //app.TRACE = !app.TRACE;

    //app.particles.push(new Particle(particles.length - 1, Math.random() * width, Math.random() * height));

    //for(var j = 0; j < app.particles.length; j++ ) {
    //  if(app.particles[j].id === 0){
          
        //particles[j].x = e.clientX;
        //particles[j].y = e.clientY;
    //  }

      //particles[j].explode();
    //}
    // for (var i = 0; i < particles.length; i++) {
    //   particles[i].explode();
    // }
};

app.init();
requestAnimationFrame(app.viewPort.frame);
