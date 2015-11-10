function Particle(id, x, y, z) {
  this.id = id;
  this.x = Vector3d.make(x, y, z);
  this.v = Vector3d.make(0., 0., 0.);
  this.a = Vector3d.make(0., 0., 0.);
  this.aOld = Vector3d.make(0., 0., 0.);
  this.aSwap = this.a; //To flip flop back and forth, re-using the vectors.
  this.r = Vector3d.make(0., 0., 0.); //Vector pointing from self to another.
  this.dt = app.physics.variables.TIME_STEP_INTEGRATOR;
  this.dtOld = this.dt;
  this.remove = false;
  this.acceleration_to_beat = 0.;
  this.rank_to_beat = 10;
  this.mass = 2;
  this.toProfile = true;
  this.color = {r: 205 + 50 * Math.floor(Math.random() * 3), 
    g:  205 + 50 * Math.floor(Math.random() * 3),
    b:  205 + 50 * Math.floor(Math.random() * 3)};
};

Particle.prototype.speed_squared = function(){
  return Vector3d.sumsq(this.v) / (this.dt*this.dt);
}

Particle.prototype.velocity = function(){
  v = this.v.slice();
  Vector3d.scale(v, 1./this.dt);
  return v;
}

Particle.prototype.acceleration = function(){
  a = this.a.slice();
  Vector3d.scale(a, 2./(dt*dt));
  return a;
}

Particle.prototype.updateTimeStep = function(dtNew){
  this.dtOld = this.dt;
  this.dt = dtNew;
  var f = this.dt / this.dtOld;
  var f_sq = f*f;

  this.v[0] *= f;
  this.v[1] *= f;
  this.v[2] *= f;

  this.a[0] *= f_sq;
  this.a[1] *= f_sq;
  this.a[2] *= f_sq;

  //Leapfrog will discard these contents, but if anthing else needs them, they'll be correct.

  this.aOld[0] *= f_sq;
  this.aOld[1] *= f_sq;
  this.aOld[2] *= f_sq;

  this.acceleration_to_beat *= f_sq;

}

Particle.prototype.profileAcceleration = function(){
  //Finds distance**2, magnitude of gravity accelerations (in length units)
  accelerations = [];
  for (var i=0;i< app.particles.length; i++){
    curr = app.particles[i];
    
    if(curr.id === this.id ) {continue;}

    this.r[0] = curr.x[0] - this.x[0];
    this.r[1] = curr.x[1] - this.x[1];
    this.r[2] = curr.x[2] - this.x[2];

    d2 =  this.r[0] * this.r[0] + 
          this.r[1] * this.r[1] + 
          this.r[2] * this.r[2];
    accelerations.push(curr.mass / d2);
  }
  accelerations.sort(function(a, b){return b-a});
  this.rank_to_beat = Math.min(accelerations.length, Math.ceil(Math.sqrt(app.particles.length)), this.rank_to_beat);
  this.acceleration_to_beat = accelerations[this.rank_to_beat-1];
  this.toProfile = false;
}

Particle.prototype.calcAcceleration = function(){
  var curr,
    grav,
    i;
  var d, d2, d3;
  var dt_sq_over2 = (this.dt*this.dt)/2.;
  var acceleration = 0.;
  var heavy_hitters = 0.;

  this.aSwap = this.aOld; //To Re-use.
  this.aOld = this.a;
  this.a = this.aSwap;
  this.a.set([0.,0.,0.]);

  // if (this.toProfile) {this.profileAcceleration();}


  for (i = 0; i < app.particles.length; i++) {
    curr = app.particles[i];
    if (curr.id === this.id) {continue;}
      this.r[0] = curr.x[0] - this.x[0];
      this.r[1] = curr.x[1] - this.x[1];
      this.r[2] = curr.x[2] - this.x[2];
  
      d2 =  this.r[0] * this.r[0] + 
            this.r[1] * this.r[1] + 
            this.r[2] * this.r[2];
      // d2 = Vector3d.sumsq(this.r);
      
      if (d2 < app.COLLISION_IMMENENCE_RANGE2){
        this.checkPotentialCollision(d2, curr);
      }
      
      acceleration = curr.mass / d2;
      
      if (acceleration > this.acceleration_to_beat){
        heavy_hitters++;      
          d  = Math.sqrt(d2);
          d3 = d2 * d;
          this.r[0] *= (acceleration / d);
          this.r[1] *= (acceleration / d);
          this.r[2] *= (acceleration / d);
  
          this.a[0] += this.r[0];
          this.a[1] += this.r[1];
          this.a[2] += this.r[2];
      }
/*  By recording and ranking recent acceleration strengths, a minimum
threshold (10th strongest) must be beat before the particle will
perform detailed calculations in reaction to another.  The acceleration
threshold and threshold rank update when the particle experiences too
many or too few interactions above its threshold.  For 44 Particles,
most particles seem to settle on 7th strongest influences.*/
  // if (heavy_hitters > 2 * this.rank_to_beat){ //In a tough neighborhood!
  //   this.rank_to_beat += 2;
  //   this.toProfile = true;
  // }else if ((heavy_hitters < this.rank_to_beat / 2) && (this.rank_to_beat > 3)){
  //   this.rank_to_beat = Math.ceil(this.rank_to_beat / 2);
  //   this.toProfile = true;
  // }
    }
  Vector3d.scale(this.a, app.physics.constants.GRAVITY_CONSTANT * dt_sq_over2);
};

Particle.prototype.checkPotentialCollision = function(d2, curr) {
  // collision detection: if we're in range, add us (this particle and it's acceleration pair)
  // to the global list of potential collisions.  To avoid redundant work, only do this when
  // this particle has the lower id of the pair.  (don't do it twice when we calculate the inverse)
  var d3 = d2; // TODO: set to d3?
  if (this.id < curr.id) {
    var lastBucket = -1;
    for (var bucket in app.potentialCollisions) {
      var num = (new Number(bucket) / 100);
      if (lastBucket < d2 && d2 < num)
        app.potentialCollisions[(lastBucket * 100).toString()].push([this.id, curr.id]);

      lastBucket = num;
    }
  }
};

Particle.prototype.updatePosition = function() {
  this.x[0] += this.a[0];
  this.x[1] += this.a[1];
  this.x[2] += this.a[2];

  this.x[0] += this.v[0];
  this.x[1] += this.v[1];
  this.x[2] += this.v[2];
};

Particle.prototype.updateVelocity = function() {
  this.v[0] += (this.aOld[0] + this.a[0]);
  this.v[1] += (this.aOld[1] + this.a[1]);
  this.v[2] += (this.aOld[2] + this.a[2]);
};

Particle.prototype.kineticE = function(){
  return this.mass * this.speed_squared()/ 2;
}

Particle.prototype.isBoundTo = function(p2){
  //The expression is equivalent to Mechanical Energy < 0
  var vSq = Vector3d.distSquared(this.v, p2.v);
  var d   = Vector3d.distance(this.x, p2.x);
  var GM = app.Physics.GRAVITY_CONSTANT*(this.mass+p2.mass);
  return (d * (vSq/2.) < GM);
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

  particle.x.set([app.halfWidth - localRadius * Math.cos(config.arc),
                  app.halfHeight - localRadius * Math.sin(config.arc),
                  0.0]);
  
  particle.v.set([localOrbitalVelocity * Math.sin(config.arc),
                  localOrbitalVelocity * (-Math.cos(config.arc)),
                  0.0]);

  Vector3d.scale(particle.v, app.physics.variables.TIME_STEP_INTEGRATOR);
  
  //Just for safety, initialize to zero.  
  particle.a.set([0., 0., 0.]);


  particle.size = config.drawSize;    
  particle.drawColor = '#' + this.color.r.toString(16) + this.color.g.toString(16) + this.color.b.toString(16);
};
