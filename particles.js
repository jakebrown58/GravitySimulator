function Particles() {
  this.objects = {};
  this.objects.COMETS = Math.floor( Math.random() * 50);
  this.objects.ASTEROIDS = Math.floor( Math.random() * 50);
  this.objects.JUPITERCLOUD = Math.floor( Math.random() * 50);
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

    app.particles = [];

  if(app.physics.variables.CALC_STYLE === 'real') {
    initialObjects = [
      {name: 'Sun', mass: jupiterMass * 1047, radius: 696342, orbitalVelocity: 0, drawSize: 3, color: {r: 255, g: 255, b: 220}},
      {name: 'Mercury', mass: earthMass * .055, radius: 1234, orbits: [{mass: sunMass, radius: aU * .387098}], drawSize: .5},
      {name: 'Venus', mass: earthMass * .815, orbits: [{mass: sunMass, radius: aU * .72}], drawSize: 1},
      {name: 'Earth', mass: earthMass, radius: 6371, orbits: [{mass: sunMass * .94, radius: aU}], drawSize: 1, color: {r: 180, g: 200, b: 255}},
      {name: 'Mars', mass: earthMass * .107, orbits: [{mass: sunMass, radius: aU * 1.38}], drawSize: .6, color: {r: 255, g: 160, b: 160}},
      {name: 'Jupiter', mass: jupiterMass, radius: 69911, orbits: [{mass: sunMass, radius: aU * 5.2}], arc: jupiterArc, drawSize: 1.4},    
      {name: 'Saturn', mass: jupiterMass * .30, orbits: [{mass: sunMass, radius: aU * 9.5}], drawSize: 1.3, color: {r: 255, g: 215, b: 165}},
      {name: 'Neptune', mass: earthMass * 17.147, orbits: [{mass: sunMass, radius: aU * 30}], drawSize: 1, color: {r: 150, g: 160, b: 215}},
      {name: 'Ganymede', mass: earthMass * .025, orbits: [{mass: sunMass, radius: aU * 5.2}, {mass: jupiterMass, radius: aU * .014}], arc: jupiterArc, drawSize: .6},
      {name: 'AlphaCentauri', mass: jupiterMass * 1047 * 3.1, radius: 696342, distance: aU * app.physics.constants.LIGHTYEAR_PER_AU * 4,orbitalVelocity: 0, arc: -Math.PI, drawSize: 3, color: {r: 255, g: 215, b: 230}},
    ];
  } else {
    var centerMass =  Math.floor(30 + jupiterMass * Math.random() * 3000),
      colorShift = (1 - (centerMass / 3000)) / 2;
      planetMass = earthMass * Math.random() * 600;
    initialObjects = [
      {name: 'Star', mass: centerMass, radius: 800000, orbitalVelocity: 0, drawSize: 3, color: {r: 255, g: 255 - Math.floor(255 * colorShift), b: 255 - Math.floor(220 * colorShift)}}
//      {name: 'Planet 1', mass: planetMass, radius: 69911, orbits: [{mass: centerMass * Math.sqrt(centerMass), radius: aU + aU * Math.random() * 8}], drawSize: .6, color: {r: 255, g: 215, b: 165}}
    ];
  }

  while(initialObjects.length > 0) {
    this.buildParticle(initialObjects.shift());
  }

  for (i = 0; i < this.objects.ASTEROIDS; i++) {
    this.buildParticle({name: 'Asteroid ' + i, mass: earthMass / (8000 + Math.random() * 25000), orbits: [{mass: sunMass, eccentric: 'little', radius: aU * 1.5 + aU * Math.random() * 3.5}], drawSize: .1});
  }

  for (i = 0; i < this.objects.COMETS; i++) {
    this.buildParticle({name: 'COMET' + i, mass: earthMass / (8000 + Math.random() * 25000),  distance: aU * 16 + aU * (Math.random() * 340), orbitalVelocity: -.14 + Math.random() * 6.02, drawSize: .1});
  }

  for (i = 0; i < this.objects.JUPITERCLOUD; i++) {
    this.buildParticle({
      name: 'Jupiter Cloud' + i, 
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

  app.PARTICLECOUNT = app.particles.length -1;
};

Particles.prototype.buildParticle = function(cfg) {
    var tmp = new Particle();
    tmp.configure(cfg);
    app.particles.push(tmp);
};
