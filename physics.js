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


  this.variables = {};
  this.variables.TIME_STEP = 1;
  this.variables.CALC_STYLE = 'real';
  this.variables.CALC_STYLE_VELOCITY_MOD = 1;
}

Physics.prototype.leapFrog = function () {
  var ps = app.particles,
    i;
  for (i = 0; i < ps.length; i++) {
    ps[i].updatePosition();
  }
  for (i = 0; i < ps.length; i++) {
    ps[i].calcAcceleration();
  }
  for (i = 0; i < ps.length; i++) {
    ps[i].updateVelocity();
  }  
};

Physics.prototype.collide_glom = function(p1, p2) {
  var big, little;
  if (p1.mass > p2.mass){
    big = p1;
    little = p2;
  }else{
    big = p2;
    little = p1;
  }
  var mass = big.mass + little.mass;
  var fracB = big.mass / mass;
  var fracL = little.mass / mass;
  cfg = {
        id: big.id,
        name: big.name,
        mass: mass,
        
        x: (fracB*big.x + fracL*little.x),
        y: (fracB*big.y + fracL*little.y),
        oldx: (fracB*big.oldx + fracL*little.oldx),
        oldy: (fracB*big.oldy + fracL*little.oldy),
        
        velx: (fracB*big.velx + fracL*little.velx),
        vely: (fracB*big.vely + fracL*little.vely),
        oldvelx: (fracB*big.oldvelx + fracL*little.oldvelx),
        oldvely: (fracB*big.oldvely + fracL*little.oldvely),
        
        accx: (fracB*big.accx + fracL*little.accx),
        accy: (fracB*big.accy + fracL*little.accy),
        oldaccx: (fracB*big.oldaccx + fracL*little.oldaccx),
        oldaccy: (fracB*big.oldaccy + fracL*little.oldaccy),

        color:{r: big.color.r*fracB + little.color.r*fracL,
               g: big.color.g*fracB + little.color.g*fracL,
               b: big.color.b*fracB + little.color.b*fracL},
        };
  cfg.U = 0;
  cfg.U += big.U || 0;
  cfg.U += little.U || 0;
  cfg.U += big.kineticE() + little.kineticE() - cfg.kineticE();  //Leftover energy becomes thermal E of new thingy.
  //Todo: add new particle to app.particles using buildParticle(cfg);
  //Todo: remove p1, p2 from app.particles.
};
