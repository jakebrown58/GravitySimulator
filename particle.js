function Particle(id, x, y, z) {
  this.id = id; 
  this.position = new Vector3d(x,y,z);
  this.vel = new Vector3d(0., 0., 0.);
  this.acc = new Vector3d(0., 0., 0.);
  this.acc_old = new Vector3d(0., 0., 0.);
  this.acc_Swap = this.acc; //To flip flop back and forth, re-using the vectors.
  this.r = new Vector3d(0., 0., 0.); //Vector pointing from self to another.
  this.dt = app.physics.variables.TIME_STEP_INTEGRATOR;
  this.dt_old = this.dt;
  this.remove = false;

  this.mass = 2;
  this.color = {r: 205 + 50 * Math.floor(Math.random() * 3), 
    g:  205 + 50 * Math.floor(Math.random() * 3),
    b:  205 + 50 * Math.floor(Math.random() * 3)};
};

Particle.prototype.speed_squared = function(){
  return this.vel.sumsq() / (this.dt*this.dt);
}

Particle.prototype.velocity = function(){
  return new Vector3d(this.vel.x, this.vel.y, this.vel.z).scale(1./this.dt);
}

Particle.prototype.acceleration = function(){
  return new Vector3d(this.acc.x, this.acc.y, this.acc.z).scale(2./(dt*dt));
}

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
}


Particle.prototype.calcAcceleration = function(){
  var curr,
    grav,
    i;
  var d, d2, d3;
  var dt_sq_over2 = (this.dt*this.dt)/2.;
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
      var num = (new Number(bucket) / 100);
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
}

Particle.prototype.isBoundTo = function(p2){
  var mu = (this.mass * p2.mass) / (this.mass + p2.mass);
  v2 = this.velocity().dist_squared(p2.velocity());
  d  = this.position.distance(p2.position);
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

  particle.position.x = app.halfWidth - localRadius * Math.cos(config.arc);
  particle.position.y = app.halfHeight - localRadius * Math.sin(config.arc);
  particle.position.z = 0.0;
  
  particle.vel.x = localOrbitalVelocity * Math.sin(config.arc);
  particle.vel.y = localOrbitalVelocity * (-Math.cos(config.arc));
  particle.vel.z = 0.0;

  particle.vel.scale(app.physics.variables.TIME_STEP_INTEGRATOR);
  
  //Just for safety, initialize to zero.  
  particle.acc.x = 0.;
  particle.acc.y = 0.;
  particle.acc.z = 0.;


  particle.size = config.drawSize;    
  particle.drawColor = '#' + this.color.r.toString(16) + this.color.g.toString(16) + this.color.b.toString(16);
};
