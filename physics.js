function Physics() {
  this.constants = {};
  this.constants.DAMPING = 1;
  this.constants.GRAVITY_CONSTANT = 1 / 100;   // 1500 will result in a time-step equal to about 1 earth-day.  lower is faster.
  this.constants.ORIGINAL_GRAVITY_CONSTANT = 1 / 100; // helps us get back to a base-state.
  this.constants.ORIGINAL_VELOCITY_FACTOR = 1;
  this.constants.JUPITER_MASS = 1;
  this.constants.EARTH_MASS = 1 / 317;
  this.constants.ASTRONOMICAL_UNIT = 50;  // astronomical unit / ie, 1 Earth distance from the sun.
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
}

Physics.prototype.reverseTime = function() {
  this.updateTimeStep(this.variables.TIME_STEP * -1);
}

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
    ps[app.FOLLOW].v.setXYZ(rocketVel.x, rocketVel.y, rocketVel.z);
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
  var mass  = big.mass + little.mass;
  var fracB = big.mass / mass;
  var fracL = little.mass / mass;
// Why do we do this to the little particle?  -- bad bad hacky reasons.  better to Oblitterate it.
  little.mass = 0.00000000000001;
  little.vel = new Vector3d(0., 0., 0.);
  little.acc = new Vector3d(0., 0., 0.);
  little.position = Vector3d.prototype.randomOfMagnitude(5000 + 5000 * Math.random());
  little.color = {r: 0, b: 0, g: 0};
  little.destroyed = true;


  var vol = 1.33 * Math.PI * Math.pow(big.radius, 3);
  var newVolume = mass / (big.mass / vol);
  big.radius = Math.cbrt((newVolume * .75 / Math.PI));
  big.normalizedRadius = app.physics.constants.ASTRONOMICAL_UNIT * big.radius / app.physics.constants.KM_PER_AU;;

  big.mass = mass;
  
  big.position.scale(fracB);
  little.position.scale(fracL);
  big.position.increment(little.position);
  

  little.position = new Vector3d(-152115125, Math.random() * -125125427, Math.random() * 12500);

  // big.oldpos.scale(fracB);
  // little.oldpos.scale(fracL);
  // big.oldpos.v_inc_by(little.oldpos);

  big.vel.scale(fracB);
  little.vel.scale(fracL);
  big.vel.increment(little.vel);

  // big.oldvel.v_scale(fracB);
  // little.oldvel.v_scale(fracL);
  // big.oldvel.v_inc_by(little.oldvel);
  
  big.acc.scale(fracB);
  little.acc.scale(fracL);
  big.acc.increment(little.acc);

  big.acc_old.scale(fracB);
  little.acc_old.scale(fracL);
  big.acc_old.increment(little.acc_old);


  // cfg.U = 0;
  // cfg.U += big.U || 0;
  // cfg.U += little.U || 0;
  // cfg.U += big.kineticE() + little.kineticE() - cfg.kenetic;  //Leftover energy becomes thermal E of new thingy.

  // cfg.kenetic = (1/2) * cfg.mass * (cfg.velx * cfg.velx + cfg.vely * cfg.vely)

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
  if (followDirection < 0.) followDirection += 360
  return followDirection;
};

Physics.prototype.createCollidingParticleList = function() {
  var p = app.particles,
    ret = [],
    i,
    j;

  for(i = 0; i < p.length; i++) {
    for(j = i + 1; j < p.length; j++) {
      if(p[i].id != p[j].id) {
        if(this.areParticlesVeryClose(p[i], p[j])) {
          ret.push({big: p[j], little: p[i]});
        }
      }
    }
  }

  return ret;
};

Physics.prototype.handleCollisions = function() {
  var coll = app.potentialCollisions["0"]; //app.flattenPotentialCollisions();
  if(coll.length) {
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
    
    // this is garbage collecter heaven here.... clean up at some point if we want a speed boost from post-collisions.
    var newParticles = [];
    for(i = 0; i < app.particles.length; i++){
      if(app.particles[i].destroyed !== true) {
        newParticles.push(app.particles[i]);
      }
    }

    for(i = 0; i < newParticles.length; i++){
      if(app.FOLLOW === newParticles[i].id) {
        app.FOLLOW = i;
      }
      newParticles[i].id = i;
    }

    app.particles = newParticles;
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

Physics.prototype.convertTicksToEarthTime = function(ticks) {

};