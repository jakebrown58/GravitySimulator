function Particle(id, x, y, z) {
  this.id = id; 
  this.position = [x, y, z]
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

Particle.prototype.d3to = function(p2){
  return this.position.v_dist3to(p2.position);
};

Particle.prototype.d2to = function(p2){
  //Note that this (distance squared) is the cheapest
  //Of the distance functions to calculate.
  return this.position.v_dist2to(p2.position);
};

Particle.prototype.distanceto = function(p2){
  return this.position.v_distanceto(p2.position);
};


Particle.prototype.d3Spyro = function(dx, dy, dz) {
  //var tmp = Math.sqrt(dx * dx + dy * dy);
  //return tmp * tmp;
  var tmp = dx * dx + dy * dy + dz * dz;
  return Math.sqrt(tmp) * tmp;
};


Particle.prototype.calcAccelerationOpen = function(d3Fn){
  var curr,
    grav,
    i,
    d3;

  this.oldacc = this.acc.slice(0);
  this.acc    = [0., 0., 0.];


  for (i = 0; i < app.particles.length; i++) {
    curr = app.particles[i];
    if(curr.id !== this.id ) {
      rel = [curr.position[0] - this.position[0],
             curr.position[1] - this.position[1],
             curr.position[2] - this.position[2]]
      d3 = curr.d3to(this);

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
        rel.v_scale(curr.mass * app.physics.constants.GRAVITY_CONSTANT / d3);
        this.acc.v_inc_by(rel);
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

  this.oldpos = this.position.slice(0); //Not used by leapfrog itself.

  delta_position = this.acc.slice(0);

  delta_position.v_scale (  dt/2    );
  delta_position.v_inc_by( this.vel );
  delta_position.v_scale (  dt      );
  
  this.position.v_inc_by(delta_position)
};

Particle.prototype.updateVelocity = function() {
  var dt = app.physics.variables.TIME_STEP_INTEGRATOR;
  this.oldvel = this.vel.slice(0);//Not used by leapfrog itself.

  this.oldDirection = app.physics.getParticleDirection(this);
  
  delta_v = this.oldacc.slice(0);
  delta_v.v_inc_by ( this.acc );
  delta_v.v_scale  ( dt / 2.  );
  this.vel.v_inc_by( delta_v  );

  this.direction = app.physics.getParticleDirection(this);
};

Particle.prototype.kineticE = function(){
  return (1./2.) * this.mass * this.vel.v_sumsq();
}

Particle.prototype.isBoundTo = function(p2){
  var mu = (this.mass * p2.mass) / (this.mass + p2.mass),
  v2 = this.vel.v_dist2to(p2.vel);
  d = this.distanceto(p2);
  energy = 0;

  if(d > 0) {
    energy = (mu * v2 / 2.0) - (app.Physics.GRAVITY_CONSTANT * this.mass * p2.mass / d);
  }
  return energy < 0;
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
  particle.position = [app.halfWidth - localRadius * Math.cos(config.arc),
                      app.halfHeight - localRadius * Math.sin(config.arc),
                      0.0];

  particle.vel = [localOrbitalVelocity * Math.sin(config.arc),
                      localOrbitalVelocity * -Math.cos(config.arc),
                      0.0];

  particle.acc = [0., 0., 0.];

  particle.size = config.drawSize;    
  particle.drawColor = '#' + this.color.r.toString(16) + this.color.g.toString(16) + this.color.b.toString(16);
};
