function Particle(id, x, y, z) {
  this.id = id; 
  this.x = x;
  this.y = y;
  this.z = z;
  this.remove = false;

  this.mass = 2;
  this.color = {r: 205 + 50 * Math.floor(Math.random() * 3), 
    g:  205 + 50 * Math.floor(Math.random() * 3),
    b:  205 + 50 * Math.floor(Math.random() * 3)};
};

Particle.prototype.calcAcceleration = function(){
  if(app.physics.variables.CALC_STYLE === 'real') {
    this.calcAccelerationOpen(this.d3Real);
  } else {
    this.calcAccelerationOpen(this.d3Spyro);
  }
};

Particle.prototype.d3Real = function(dx, dy, dz) {
  var tmp = dx * dx + dy * dy + dz * dz;
  return Math.sqrt(tmp) * tmp;
};

Particle.prototype.d3Spyro = function(dx, dy, dz) {
  //var tmp = Math.sqrt(dx * dx + dy * dy);
  //return tmp * tmp;
  var tmp = dx * dx + dy * dy + dz * dz;
  return Math.sqrt(tmp) * tmp;
};


Particle.prototype.calcAccelerationOpen = function(d3Fn){
  var curr,
    dx,
    dy,
    dz,
    grav,
    i,
    d3;

  this.oldaccx = this.accx;
  this.oldaccy = this.accy;
  this.oldaccz = this.accz;

  this.accx = 0;
  this.accy = 0;
  this.accz = 0;

  for (i = 0; i < app.particles.length; i++) {
    curr = app.particles[i];
    if(curr.id !== this.id ) {
      dx = curr.x - this.x;
      dy = curr.y - this.y;
      dz = curr.z - this.z;
      d3 = d3Fn(dx, dy, dz);

      if (d3 < app.COLLISION_IMMENENCE_RANGE) {
        this.checkPotentialCollision(d3, curr);
      }

      // if(d3 < app.closestPair.d || app.closestPair === 0) {
      //   app.closestPair.d = Math.sqrt(dx * dx + dy * dy);
      //   app.closestPair.d = app.closestPair.d * app.closestPair.d;
      //   app.closestPair.x = this;
      //   app.closestPair.y = curr;
      // }

      if(d3 != 0) {
        grav = curr.mass * app.physics.constants.GRAVITY_CONSTANT / d3;
        this.accx += grav * dx;
        this.accy += grav * dy;
        this.accz += grav * dz;
      }
    }
  }
};

Particle.prototype.checkPotentialCollision = function(d3, curr) {
  // collision detection: if we're in range, add us (this particle and it's acceleration pair)
  // to the global list of potential collisions.  To avoid redundant work, only do this when
  // this particle has the lower id of the pair.  (don't do it twice when we calculate the inverse)
  if (this.id < curr.id) {
    var lastBucket = -1;
    for (var bucket in app.potentialCollisions) {
      var num = (new Number(bucket) / 100);
      if (lastBucket < d3 && d3 < num)
        app.potentialCollisions[(lastBucket * 100).toString()].push([this.id, curr.id]);

      lastBucket = num;
    }
  }
};

Particle.prototype.updatePosition = function() {
  var dt = app.physics.variables.TIME_STEP_INTEGRATOR;
  this.oldx = this.x; //Not used by leapfrog itself.
  this.oldy = this.y; //Not used by leapfrog itself.
  this.oldz = this.z;
  this.x += (this.velx + 0.5 * this.accx * dt) * dt;
  this.y += (this.vely + 0.5 * this.accy * dt) * dt;
  this.z += (this.velz + 0.5 * this.accz * dt) * dt;
};

Particle.prototype.updateVelocity = function() {
  var dt = app.physics.variables.TIME_STEP_INTEGRATOR;
  this.oldvelx = this.velx; //Not used by leapfrog itself.
  this.oldvely = this.vely; //Not used by leapfrog itself.
  this.oldvelz = this.velz;
  this.oldDirection = app.physics.getParticleDirection(this);
  this.velx += 0.5 * (this.oldaccx + this.accx) * dt;
  this.vely += 0.5 * (this.oldaccy + this.accy) * dt;
  this.velz += 0.5 * (this.oldaccz + this.accz) * dt;
  this.direction = app.physics.getParticleDirection(this);
};

Particle.prototype.kineticE = function(){
  return (1./2.) * this.mass * (this.velx * this.velx + this.vely * this.vely + this.velz * this.velz);
}

Particle.prototype.isBoundTo = function(p2){
  var mu = (this.mass * p2.mass) / (this.mass + p2.mass),
   velx = this.velx - p2.velx,
   vely = this.vely - p2.vely,
   velz = this.velz - p2.velz,
   dx = this.x - p2.x,
   dy = this.y - p2.y,
   dz = this.z - p2.z,
   sqrtD2 = Math.sqrt(dx * dx + dy * dy + dz * dz),
   v2 = velx * velx + vely * vely + velz * velz,
   energy = 0;

  if(sqrtD2 > 0) {
    energy = (mu * v2 / 2.0) - (app.Physics.GRAVITY_CONSTANT * this.mass * p2.mass / sqrtD2);
  }

  return energy > 0;
}

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
  particle.x = app.halfWidth - localRadius * Math.cos(config.arc);
  particle.y = app.halfHeight - localRadius * Math.sin(config.arc);
  particle.z = 0;

  particle.velx = localOrbitalVelocity * Math.sin(config.arc);
  particle.vely = localOrbitalVelocity * -Math.cos(config.arc);
  particle.velz = 0;

  particle.accx = 0.0;
  particle.accy = 0.0;
  particle.accz = 0.0;

  particle.size = config.drawSize;    
  particle.drawColor = '#' + this.color.r.toString(16) + this.color.g.toString(16) + this.color.b.toString(16);
};
