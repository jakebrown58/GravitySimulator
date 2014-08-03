
function Particle(id, x, y) {
  this.id = id; 
  this.x = this.oldX = x;
  this.y = this.oldY = y;
  this.remove = false;

  this.oldX = x + Math.random() * 8 - 4;
  //this.oldY = y + Math.random() * 8 - 4;

  this.mass = 2;
  this.obj = {x: this.x, y: this.y}
  this.center = {};
  this.damping = 1;
  this.color = {r: Math.floor(Math.random() * 100 + 155), 
    g:  Math.floor(Math.random() * 200 + 145), 
    b:  Math.floor(Math.random() * 100 + 155)};
};

Particle.prototype.calcAcceleration = function(){
  if(app.physics.variables.CALC_STYLE === 'real') {
    this.calcAccelerationReal();
  } else {
    this.calcAccelerationSpyrograph();
  }
};

Particle.prototype.calcAccelerationReal = function(){
  var curr,
    dx,
    dy,
    grav,
    i,
    d2,
    d3;

  this.oldaccx = this.accx;
  this.oldaccy = this.accy;

  this.accx = 0;
  this.accy = 0;

  for (i = 0; i < app.particles.length; i++) {
    curr = app.particles[i];
    if(curr.id !== this.id ) {
      dx = curr.x - this.x;
      dy = curr.y - this.y;
      d2 = dx * dx + dy * dy;
      d3 = Math.sqrt(d2) * d2;

      grav = curr.mass * app.physics.constants.GRAVITY_CONSTANT / d3;

      if (d2 > 0) {
        this.accx += grav * dx;
        this.accy += grav * dy;
      } else{
        this.accx += 0;
        this.accy += 0;
      }
    }
  }
};

Particle.prototype.calcAccelerationSpyrograph = function(){
  var curr,
    dx,
    dy,
    grav,
    i,
    d2,
    d3;

  this.oldaccx = this.accx;
  this.oldaccy = this.accy;

  this.accx = 0;
  this.accy = 0;

  for (i = 0; i < app.particles.length; i++) {
    curr = app.particles[i];
    if(curr.id !== this.id ) {
      dx = curr.x - this.x;
      dy = curr.y - this.y;
      d2 = Math.sqrt(dx * dx + dy * dy);
      d3 = d2 * d2;

      grav = curr.mass * app.physics.constants.GRAVITY_CONSTANT / d3;

      if (d2 > 0) {
        this.accx += grav * dx;
        this.accy += grav * dy;
      } else{
        this.accx += 0;
        this.accy += 0;
      }
    }
  }
};

Particle.prototype.updatePosition = function() {
  var dt = app.physics.variables.TIME_STEP;
  this.oldx = this.x; //Not used by leapfrog itself.
  this.oldy = this.y; //Not used by leapfrog itself.
  this.x += (this.velx + 0.5 * this.accx * dt) * dt;
  this.y += (this.vely + 0.5 * this.accy * dt) * dt;
};

Particle.prototype.updateVelocity = function() {
  var dt = app.physics.variables.TIME_STEP;
  this.oldvelx = this.velx; //Not used by leapfrog itself.
  this.oldvely = this.vely; //Not used by leapfrog itself.
  this.velx += 0.5 * (this.oldaccx + this.accx) * dt;
  this.vely += 0.5 * (this.oldaccy + this.accy) * dt;
};

Particle.prototype.kineticE = function(){
  return (1/2) * this.mass * (this.velx*this.velx + this.vely*this.vely);
}

Particle.prototype.isBoundTo = function(p2){
  var mu = (this.mass * p2.mass) / (this.mass + p2.mass);
  var velx = this.velx - p2.velx;
  var vely = this.vely - p2.vely;
  var dx = this.x - p2.x;
  var dy = this.y - p2.y;
  var d2 = dx*dx + dy*dy;
  var v2 = velx*velx + vely*vely;
  var energy = mu * v2/2.0 - app.Physics.GRAVITY_CONSTANT * this.mass * p2.mass / Math.sqrt(d2);
  if (energy > 0){
    return false;
  }else{
    return true;
  }
}

Particle.prototype.checkClock = function() {
    return this.x > app.halfWidth && this.oldy < app.halfHeight && this.y > app.halfHeight;
};

Particle.prototype.configure = function(config) {
  var particle = this,
    localOrbitalVelocity = 0,
    localRadius = config.distance || 0;

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

  particle.radius = config.radius || 1;
  particle.name = config.name;
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
  var obj,
    drawSize = this.size;

  if(app.DRAWSTATE === 0) {
    obj = app.viewPort.project(this.x, this.y, 0);
  } else {
    obj = {x: this.x, y: this.y};
    obj.x = (this.x - app.viewPort.center.x) + (this.x - app.particles[app.FOLLOW].x) * app.VIEWSHIFT.zoom;
    obj.y = (this.y - app.viewPort.center.y) + (this.y - app.particles[app.FOLLOW].y) * app.VIEWSHIFT.zoom;
  }

  if(this.radius > 1) {
    drawSize = app.physics.constants.ASTRONOMICAL_UNIT * this.radius / app.viewPort.viewPortSizeInKm;
    drawSize = drawSize > this.size ? drawSize : this.size;
  }


  app.ctx.strokeStyle = this.drawColor;
  app.ctx.lineWidth = drawSize;
  app.ctx.beginPath();
  app.ctx.arc(obj.x, obj.y, app.ctx.lineWidth, 0, 2 * Math.PI, false);  

  if(drawSize >= 1) {
    app.ctx.fillStyle = app.ctx.strokeStyle;
    app.ctx.fill();
  }

  app.ctx.stroke();
  ////app.ctx.moveTo(this.oldX, this.oldY);
  //app.ctx.lineTo(this.x + 1, this.y + 1);
};
