
/* ******************* VIEWPORT ******************************************************* */

function ViewPort(){
  this.frameCount = 0;
  this.txtOffset = 25;
  this.lineHeight = 20;
  this.draw = true;
  this.viewAngle   = Math.PI/3.;
  this.shift   = {x: -50, y: 0, z: 0, zoom: 0};
  this.viewPortSize = (app.width / (this.shift.zoom + 1)) / app.physics.constants.ASTRONOMICAL_UNIT;
  this.viewPortSizeInKm = app.physics.constants.KM_PER_AU * this.viewPortSize;
  this.colorSorted = false;
  this.DRAW_STATE_TOP_DOWN = 0;
  this.DRAW_STATE_ISOMETRIC = 1;
  this.MAX_DRAW_STATE       = 1;
  this.DRAW_STATE_SPLASH    = 4;
  this.drawState = this.DRAW_STATE_SPLASH;
}

ViewPort.prototype.cycleState = function(){
  this.drawState++;
  if (this.drawState > this.MAX_DRAW_STATE) this.drawState = 0;
}

ViewPort.prototype.splash = function() {
  var version = "2.0";
  this.appendLine("Planetary Gravity Simulator");
  this.appendLine("v " + version);
  this.appendLine("");
  this.appendLine("Type 'v' to exit the splash screen.");
  this.appendLine("Type ' ' then '~' to enter console mode, and type help from there to learn about commands.");
  this.appendLine("Also has one-key instant commands in direct mode: ");
  this.appendLine('....viewToggle - v');
 this.appendLine('....trace - <space>');
 this.appendLine('....reset - R');
 this.appendLine('....reverseTime - T');
 this.appendLine('....viewShiftUp - W');
 this.appendLine('....viewShiftDown - S');
 this.appendLine('....viewShiftLeft - A');
 this.appendLine('....viewShiftRight - D');
 this.appendLine('....switchClickAction - M');
 this.appendLine('....pause - P');
 this.appendLine('....visualLogging - C');
 this.appendLine('....follow - F');
 this.appendLine('....speedItUp - X');
 this.appendLine('....slowItDown - Z');
  this.appendLine('....toggleCommandMode - ~');
  this.appendLine('....zoomOut - <');
  this.appendLine('....zoomIn - >');
 this.appendLine('....switchToDefaultView - H');
 this.appendLine('....rocketEnginesBurnToggle - B');
 this.appendLine('....rocketRotateLeft - LEFT');
 this.appendLine('....rocketIncreaseThrust - UP');
};

// ViewPort.prototype.project = function(flatX, flatY, flatZ) {
//   var point = app.viewPort.iso(flatX, flatY);
//   var x0 = app.width * 0.5;
//   var y0 = app.height * 0.2;
//   var z = app.size * 0.5 - flatZ + point.y * Math.sin(app.VIEWANGLE);
//   var x = (point.x - app.size * 0.5) * 6;
//   var y = (app.size - point.y) * 0.005 + 1;

//   return {
//     x: this.shift.x + x0 + x / y,
//     y: this.shift.y + y0 + z / y
//   };
// };

// ViewPort.prototype.iso = function(x, y) {
//   return {
//     x: 0.5 * (app.size + x - y),
//     y: 0.5 * (x + y)
//   };
// };
//A viewport can be thought of as a map from
//Objects in sim units
//Landmarks in sim units (such as object we're following)
//to app(screen coords)
//response.js will tell us the details of the window
//It also draws them there.


ViewPort.prototype.drawParticles = function() {
  var particles = app.particles;

  var currColor = particles[0].drawColor;
  // app.FOLLOWXY = app.particles[app.FOLLOW].position.asXYZ();
  app.ctx.strokeStyle = currColor;
  for(var i = 0 ; i < app.particles.length; i++ ){
    if(particles[i].drawColor != currColor) {
      currColor = particles[i].drawColor;
      app.ctx.strokeStyle = currColor;
    }

    this.drawParticle(particles[i]);
  }
};


ViewPort.prototype.XY = function(position){
  //Takes the position and maps it to viewport x, y coordinates.
  var r = new Vector3d(0., 0., 0.);
  r.setFromV(position);
  r.decrement(app.particles[app.FOLLOW].position);

  var xy = {x: r.dot(this.xAxis), y:r.dot(this.yAxis)};
  xy.x = (xy.x)*(1+this.shift.zoom) + app.halfWidth  - this.shift.x;
  xy.y = (xy.y)*(1+this.shift.zoom) + app.halfHeight - this.shift.y;
  return xy;
}




ViewPort.prototype.drawParticle = function(particle) {
  var obj,
    drawSize = particle.size;

  obj = this.XY(particle.position);

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


  if(app.response.MODE === 'ROCKET') {
    if(particle.id === app.FOLLOW) {
      var direction = particle.direction / 180 * Math.PI;
      var heading = app.thrust.heading / 180 * Math.PI;
      app.ctx.lineWidth = 3;
      app.ctx.lineTo(obj.x + 12 * Math.cos(direction), obj.y + 12 * Math.sin(direction));

      if(particle.name.slice(0, 6) == 'ROCKET') {
        app.ctx.moveTo(obj.x, obj.y);
        app.ctx.lineTo(obj.x + 24 * Math.cos(heading), obj.y + 24 * Math.sin(heading));
      }
    }
  }

  app.ctx.stroke();
};

ViewPort.prototype.frame = function() {
  var current;

  if(app.GO) {
    requestAnimationFrame(app.viewPort.frame);

    if(!app.TRACE) {
      app.ctx.clearRect(0, 0, app.width, app.height);
    }

    app.viewPort.frameActions();

  }


};

ViewPort.prototype.frameActions = function() {
  if(this.drawState === this.DRAW_STATE_SPLASH) {
    app.ctx.lineWidth = 1;

    app.ctx.font="20px Arial";
    app.ctx.strokeStyle = app.particles[0].drawColor;
    this.txtOffset = 25;
    app.viewPort.splash();
    this.txtOffset = 25;

    app.ctx.beginPath();

    //app.ctx.arc(obj.x, obj.y, app.ctx.lineWidth, 0, 2 * Math.PI, false);
    app.ctx.fillStyle = app.ctx.strokeStyle;
    //app.ctx.fill();
    app.ctx.stroke();
    return;
  }
  app.viewPort.frameClock();
  app.viewPort.integrateWrapper();
  app.viewPort.setClock();
  app.viewPort.setIntegrate();
}

ViewPort.prototype.frameClock = function() {
    this.txtOffset = 25;

  if(app.response.MODE === 'ROCKET') {
    app.viewPort.showRocketTelemetry();
  }
  else if(app.SHOWCLOCK) {
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
    this.appendLine("        retro direction: " + Math.round(focusParticle.direction - 180, 0));
    this.appendLine("     Mass: " + focusParticle.mass);

    var viewPort = app.physics.convertViewPortPixelsToUnits(app.viewPort.viewPortSize);
    this.appendLine("Viewport size: " + viewPort.size + viewPort.unit);
    this.appendLine("Click Action: " + app.response.MODE);

    var totalMass = 0,
      totalEnergy = 0;

    for(var zz = 0; zz < app.particles.length; zz++) {
      totalMass += app.particles[zz].mass;
      totalEnergy += app.particles[zz].kineticE()*100000;
    }

    totalMass = Math.round(totalMass*1000,0) / 1000;
    totalEnergy = Math.round(totalEnergy*100000,0);

    this.appendLine("Total system mass: " + totalMass);
    this.appendLine("Total system energy: " + totalEnergy);
    this.appendLine("Total collisions: " + app.collisions);
    this.appendLine("Potential collisions: ");
    this.appendLine("----------------------");

    var lastBucket = null;
    for (var bucket in app.potentialCollisions) {
      var num = (new Number(bucket) / 100);
      if (lastBucket) {
        var list = app.potentialCollisions[lastBucket];
        if (list.length) {
          this.appendLine("Items between " + (lastBucket / 100) + " and " + num + " apart: ");

          // BROKEN
          for (var pair in list) {
            var a = app.particles[list[pair][0]];
            var b = app.particles[list[pair][1]];
            this.appendLine("    " + a.name + " and " + b.name);
          }
          // BROKEN
        }
      }

      lastBucket = bucket;
    }
    this.appendLine("----------------------");
    // var maxMass = 0;
    // for(var xx = 0; xx < app.particles.length; xx++) {
    //   if(app.particles[xx].mass > maxMass) {
    //     maxMass = app.particles[xx].mass;
    //   }
    // }

    // this.appendLine("Most Massive: " + maxMass);

    //var closestDist = app.physics.convertViewPortPixelsToUnits(app.closestPair.d);
    //this.appendLine("Closest Pair:   x - " + app.closestPair.x.name + " y -" + app.closestPair.y.name + " d -" + closestDist.size + closestDist.unit);
    //app.closestPair.d = 1000000;

  }
};

ViewPort.prototype.showRocketTelemetry = function() {
    var focusParticle = app.particles[app.FOLLOW];
    var focusKE = Math.round(focusParticle.kineticE()*100000,0) === 0 ? Math.round(focusParticle.kineticE()*1000000000,0) / 10000 : Math.round(focusParticle.kineticE()*100000,0);
    this.appendLine("Following: " + focusParticle.name);
    this.appendLine("     Energy: " + focusKE);
    this.appendLine("     Speed: " + Math.round(app.physics.getParticleSpeed(focusParticle) * 1000, 0));
    this.appendLine("     Direction: " + Math.round(focusParticle.direction, 0));
    this.appendLine("        retro direction: " + Math.round(focusParticle.direction - 180, 0));
    this.appendLine("     Mass: " + focusParticle.mass);

    this.appendLine("   targeting: " + app.particles[3].name);
    this.appendLine("     target speed: " + Math.round(app.physics.getParticleSpeed(app.particles[3]) * 1000, 0));
    this.appendLine("     target direction: " + Math.round(app.particles[3].direction, 0));
    var solPosition = app.particles[0].position.asXYZ();
    var d3Sol = Math.round(focusParticle.dist(app.particles[0]) / app.physics.constants.ASTRONOMICAL_UNIT * 500);
    var earthPosition = app.particles[3].position.asXYZ();
    var d3Target = Math.round(focusParticle.dist(app.particles[3]) / app.physics.constants.ASTRONOMICAL_UNIT * 500);
    this.appendLine("     d(SOL): " + (d3Sol / 500));
    this.appendLine("     d(TAR): " + (d3Target / 500));

    this.appendLine("Thrust:    H: " + app.thrust.heading + " E: " + app.thrust.thrust + " B: " + app.thrust.burning);
    this.appendLine("Thrust Vector: " + app.thrust.getThrustVector().x + " | " + app.thrust.getThrustVector().y);
};

ViewPort.prototype.appendLine = function(txt) {
  app.ctx.fillText(txt, 5, this.txtOffset);
  this.txtOffset += this.lineHeight;
};

ViewPort.prototype.integrateWrapper = function() {
  /*if(app.physics.variables.TIME_STEP != 1) {
    app.physics.constants.GRAVITY_CONSTANT /= app.physics.variables.TIME_STEP;
  }*/

  app.resetPotentialCollisions();

  app.physics.leapFrog();
  app.physics.handleCollisions();
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
  app.viewPort.center = {x: (app.particles[app.FOLLOW].position.x - app.halfWidth), y: (app.particles[app.FOLLOW].position.y - app.halfHeight)};

  if(this.drawState == this.DRAW_STATE_ISOMETRIC){
    this.xAxis = Vector3d.prototype.unitFromAngles(Math.PI/2, Math.PI/2);
    this.yAxis = Vector3d.prototype.unitFromAngles(this.viewAngle+Math.PI/2, 0);
  }else{
    this.xAxis = new Vector3d(1., 0., 0.);
    this.yAxis = new Vector3d(0., 1., 0.);    
  }
  this.zAxis = this.xAxis.cross(this.yAxis);
  app.viewPort.drawParticles();
  // for (i = 0; i < app.particles.length; i++) {
  //   //current = app.particles[i];
  //   //current.x = current.newX;
  //   //current.y = current.newY;
  //   app.viewPort.drawParticle(app.particles[i]);
  // }
};


ViewPort.prototype.adjustZoom = function(direction) {
  var nearZero = this.shift.zoom < .0001 && this.shift.zoom > -.0001;
  if(nearZero === true) {
    this.shift.zoom = 0;

    if(direction === 'in') {
      this.shift.zoom = .5;
    }
    if(direction === 'out') {
      this.shift.zoom = -.015625;
    }

    return;
  }

  if(direction === 'in') {
    if(this.shift.zoom > 0) {
      this.shift.zoom = this.shift.zoom * 2;
    } else {
      this.shift.zoom = -1 - ((-1 - this.shift.zoom) * 4 / 3);
    }
  } else {
    if(this.shift.zoom > 0) {
      this.shift.zoom = this.shift.zoom / 2;
    } else {
      this.shift.zoom = -1 - ((-1 - this.shift.zoom) * 3 / 4);
    }
    
  }

  if(this.shift.zoom <= -.99995) {
    this.shift.zoom = -.99995;
  } 

  if(this.shift.zoom !== -1) {
    app.viewPort.viewPortSize = (app.width / (1 + this.shift.zoom)) / app.physics.constants.ASTRONOMICAL_UNIT;
    app.viewPort.viewPortSizeInKm = app.physics.constants.KM_PER_AU * app.viewPort.viewPortSize;  
  }



};
