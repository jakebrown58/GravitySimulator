
/* ******************* VIEWPORT ******************************************************* */

function ViewPort(){
  this.frameCount = 0;
  this.txtOffset = 25;
  this.lineHeight = 20;
  this.draw = true;
  this.viewPortSize = (app.width / (app.VIEWSHIFT.zoom + 1)) / app.physics.constants.ASTRONOMICAL_UNIT;
  this.viewPortSizeInKm = app.physics.constants.KM_PER_AU * this.viewPortSize;
  this.colorSorted = false;
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

ViewPort.prototype.drawParticles = function() {
  var particles = app.particles;

  var currColor = particles[0].drawColor;
  app.ctx.strokeStyle = currColor;
  for(var i = 0 ; i < app.particles.length; i++ ){
    if(particles[i].drawColor != currColor) {
      currColor = particles[i].drawColor;
      app.ctx.strokeStyle = currColor;
    }

    this.drawParticle(particles[i]);
  }
};

ViewPort.prototype.drawParticle = function(particle) {
  var obj,
    drawSize = particle.size;

  if(app.DRAWSTATE === 0) {
    obj = app.viewPort.project(particle.x, particle.y, 0);
  } else {
    obj = {x: particle.x, y: particle.y};
    obj.x = (particle.x - app.viewPort.center.x - app.VIEWSHIFT.x) + (particle.x - app.particles[app.FOLLOW].x) * app.VIEWSHIFT.zoom;
    obj.y = (particle.y - app.viewPort.center.y - app.VIEWSHIFT.y) + (particle.y - app.particles[app.FOLLOW].y) * app.VIEWSHIFT.zoom;
  }

  if(particle.radius > 1) {
    var pctOfViewport = particle.radius / app.viewPort.viewPortSizeInKm;
    drawSize = pctOfViewport * app.width / 2; //app.physics.constants.ASTRONOMICAL_UNIT * pctOfViewport;
    drawSize = drawSize > particle.size ? drawSize : particle.size;
  } else {
    drawSize = .2;
  }


  //app.ctx.strokeStyle = particle.drawColor;
  app.ctx.lineWidth = drawSize;
  app.ctx.beginPath();
  

  if(drawSize >= 1) {
    app.ctx.arc(obj.x, obj.y, app.ctx.lineWidth, 0, 2 * Math.PI, false);
    app.ctx.fillStyle = app.ctx.strokeStyle;
    app.ctx.fill();
  } else {
    app.ctx.arc(obj.x, obj.y, app.ctx.lineWidth, 0, 2 * Math.PI, false);
  }

  app.ctx.stroke();
};

ViewPort.prototype.frame = function() {
  var current;

  if(app.GO) {
    requestAnimationFrame(app.viewPort.frame);
  }

  if(!app.TRACE) {
    app.ctx.clearRect(0, 0, app.width, app.height);
  }

  app.viewPort.frameActions();
};

ViewPort.prototype.frameActions = function() {
  app.viewPort.frameClock();
  app.viewPort.integrateWrapper();
  app.viewPort.setClock();
  app.viewPort.setIntegrate();
}

ViewPort.prototype.frameClock = function() {

  if(app.SHOWCLOCK) {
    this.txtOffset = 25;

    this.appendLine("Earth time:" + app.CLOCK.e);
    this.appendLine("Jupiter time:" + app.CLOCK.j);
    this.appendLine("Neptune time:" + app.CLOCK.n);
    this.appendLine("Started:" + app.realTime);
    this.appendLine("Now:" + Date());


    var frameRate = Math.floor((1000 * app.CLOCK.ticks / (new Date() - new Date(app.splitTime))));
    var hoursPerTick = app.physics.constants.EARTH_HOURS_PER_TICK_AT_TIME_STEP_1 * app.physics.variables.TIME_STEP_INTEGRATOR;
    var daysPerSecond = frameRate * (hoursPerTick / 24);
    this.appendLine("Simulation Speed: " + app.physics.variables.TIME_STEP);

    if(hoursPerTick > 1) {
      this.appendLine("    Hours Per Tick: " + Math.floor(hoursPerTick * 10) / 10);
      this.appendLine("    Days Per Second: " + Math.floor(daysPerSecond));
    } else if( hoursPerTick > .0166) {
      this.appendLine("    Minutes Per Tick: " + Math.floor(60 * hoursPerTick * 10) / 10);
      this.appendLine("    Hours Per Second: " + Math.floor(daysPerSecond * 24));
    } else {
      this.appendLine("    Seconds Per Tick: " + Math.floor(3600 * hoursPerTick * 10) / 10);
      this.appendLine("    Minutes Per Second: " + Math.floor(daysPerSecond * 1440));
    }
    this.appendLine("Ticks: " + app.CLOCK.ticks);
    this.appendLine("    Total Days: " + Math.floor((hoursPerTick / 24) * app.CLOCK.ticks));    
    this.appendLine("    FrameRate: " + frameRate);

    var focusParticle = app.particles[app.FOLLOW];
    var focusKE = Math.round(focusParticle.kineticE()*100000,0) === 0 ? Math.round(focusParticle.kineticE()*1000000000,0) / 10000 : Math.round(focusParticle.kineticE()*100000,0);
    this.appendLine("Following: " + focusParticle.name);
    this.appendLine("     Energy: " + focusKE);
    this.appendLine("     Speed: " + Math.round(app.physics.getParticleSpeed(focusParticle) * 1000, 0));
    this.appendLine("     Direction: " + Math.round(focusParticle.direction, 0));
    this.appendLine("     Mass: " + focusParticle.mass);

    var viewPort = app.physics.convertViewPortPixelsToUnits(app.viewPort.viewPortSize);
    this.appendLine("Viewport size: " + viewPort.size + viewPort.unit);
    this.appendLine("Click Action: " + app.response.MODE);

    var totalMass = 0,
      totalEnergy = 0;

    // for(var zz = 0; zz < app.particles.length; zz++) {
    //   totalMass += app.particles[zz].mass;
    //   totalEnergy += Math.round(app.particles[zz].kineticE()*100000,0);
    // }

    this.appendLine("Total system mass: " + totalMass);
    this.appendLine("Total system energy: " + totalEnergy);
    this.appendLine("Total collissions: " + app.collissions);

    var maxMass = 0;
    for(var xx = 0; xx < app.particles.length; xx++) {
      if(app.particles[xx].mass > maxMass) {
        maxMass = app.particles[xx].mass;
      }
    }

    this.appendLine("Most Massive: " + maxMass);

    //var closestDist = app.physics.convertViewPortPixelsToUnits(app.closestPair.d);
    //this.appendLine("Closest Pair:   x - " + app.closestPair.x.name + " y -" + app.closestPair.y.name + " d -" + closestDist.size + closestDist.unit);
    //app.closestPair.d = 1000000;
  }
};

ViewPort.prototype.appendLine = function(txt) {
  app.ctx.fillText(txt, 5, this.txtOffset);
  this.txtOffset += this.lineHeight;
};

ViewPort.prototype.integrateWrapper = function() {
  /*if(app.physics.variables.TIME_STEP != 1) {
    app.physics.constants.GRAVITY_CONSTANT /= app.physics.variables.TIME_STEP;
  }*/

  app.physics.leapFrog();
};


ViewPort.prototype.setClock = function() {
  app.CLOCK.ticks += 1;
  //app.CLOCK.e += app.particles[3].checkClock() ? 1 : 0;
  //app.CLOCK.j += app.particles[5].checkClock() ? 1 : 0;
  //app.CLOCK.n += app.particles[7].checkClock() ? 1 : 0; 

  if(app.CLOCK.ticks > 1000000) {
    app.CLOCK.ticks = 0;
  }
};

ViewPort.prototype.setIntegrate = function() {
  app.viewPort.center = {x: (app.particles[app.FOLLOW].x - app.halfWidth), y: (app.particles[app.FOLLOW].y - app.halfHeight)};
  app.viewPort.drawParticles();
  // for (i = 0; i < app.particles.length; i++) {
  //   //current = app.particles[i];
  //   //current.x = current.newX;
  //   //current.y = current.newY;
  //   app.viewPort.drawParticle(app.particles[i]);
  // }
};


ViewPort.prototype.adjustZoom = function(direction) {
  var nearZero = app.VIEWSHIFT.zoom < .0001 && app.VIEWSHIFT.zoom > -.0001;
  if(nearZero === true) {
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
      app.VIEWSHIFT.zoom = -1 - ((-1 - app.VIEWSHIFT.zoom) * 4 / 3);
    }
  } else {
    if(app.VIEWSHIFT.zoom > 0) {
      app.VIEWSHIFT.zoom = app.VIEWSHIFT.zoom / 2;
    } else {
      app.VIEWSHIFT.zoom = -1 - ((-1 - app.VIEWSHIFT.zoom) * 3 / 4);
    }
    
  }

  if(app.VIEWSHIFT.zoom <= -.99995) {
    app.VIEWSHIFT.zoom = -.99995;
  } 

  if(app.VIEWSHIFT.zoom !== 0) {
    app.viewPort.viewPortSize = (app.width / (app.VIEWSHIFT.zoom)) / app.physics.constants.ASTRONOMICAL_UNIT;
    app.viewPort.viewPortSizeInKm = app.physics.constants.KM_PER_AU * app.viewPort.viewPortSize;  
  }



};
