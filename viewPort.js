
/* ******************* VIEWPORT ******************************************************* */

function ViewPort(){
  this.frameCount = 0;
  this.draw = true;
  this.viewPortSize = (app.width / (app.VIEWSHIFT.zoom + 1)) / app.physics.constants.ASTRONOMICAL_UNIT;
  this.viewPortSizeInKm = app.physics.constants.KM_PER_AU * this.viewPortSize;
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
    app.ctx.fillText("Earth time:" + app.CLOCK.e, 5, 25);
    app.ctx.fillText("Jupiter time:" + app.CLOCK.j, 5, 45);
    app.ctx.fillText("Neptune time:" + app.CLOCK.n, 5, 65);
    app.ctx.fillText("Started:" + app.realTime, 5, 85);
    app.ctx.fillText("Now:" + Date(), 5, 105);
    app.ctx.fillText("Ticks: " + app.CLOCK.ticks, 5, 125);
    app.ctx.fillText("FrameRate: " + Math.floor((1000 * app.CLOCK.ticks / (new Date() - new Date(app.splitTime)))), 65, 125);

    var focusParticle = app.particles[app.FOLLOW];
    var followSpeed = Math.sqrt(focusParticle.velx * focusParticle.velx + focusParticle.vely * focusParticle.vely);
    var focusKE = Math.round(focusParticle.kineticE()*100000,0) === 0 ? Math.round(focusParticle.kineticE()*1000000000,0) / 10000 : Math.round(focusParticle.kineticE()*100000,0);
    app.ctx.fillText("F:  energy: " + focusKE, 5, 145);
    app.ctx.fillText("     Speed: " + Math.round(followSpeed * 1000, 0), 5, 165);
    var followDirection = Math.atan(focusParticle.velx / focusParticle.vely) * 180 / Math.PI;

    var q34 = focusParticle.velx < 0;
    var q14 = focusParticle.vely > 0;
    var q4 = q14 && q34,
      q3 = q34 && !q4,
      q1 = q14 && !q4,
      q2 = !q1 && !q3 && !q4;
    followDirection = q1 ? followDirection : q3 ? followDirection + 180 : q2 ? 180 + followDirection : followDirection + 360;


    app.ctx.fillText("     direction: " + Math.round(followDirection, 0), 5, 185);     // GRRRR..... i suck at trig in my head.....
    //app.ctx.fillText("     direction: " + followDirection, 5, 185);     // GRRRR..... i suck at trig in my head.....
    app.ctx.fillText("     Mass: " + focusParticle.mass, 5, 205);    
    app.ctx.fillText("     Name: " + focusParticle.name, 5, 225);    
    app.ctx.fillText("Time: " + app.physics.variables.TIME_STEP, 5, 245);
    var viewPortSize = app.viewPort.viewPortSize,
      unit = ' AU';
    if(viewPortSize >= app.physics.constants.LIGHTYEAR_PER_AU) {
      viewPortSize = Math.floor(10 * viewPortSize / app.physics.constants.LIGHTYEAR_PER_AU) / 10;
      unit = ' LIGHTYEARS';
    } else if(viewPortSize < 1) {
      viewPortSize = Math.floor(viewPortSize * app.physics.constants.MILES_PER_AU);
      unit = ' MILES';
    } else if( viewPortSize > 4) {
      viewPortSize = Math.floor(viewPortSize);
    }
    app.ctx.fillText("Viewport size: " + viewPortSize + unit, 5, 265);
    app.ctx.fillText("Click Action: " + app.response.MODE, 5, 285);
  }
};

ViewPort.prototype.integrateWrapper = function() {
  /*if(app.physics.variables.TIME_STEP != 1) {
    app.physics.constants.GRAVITY_CONSTANT /= app.physics.variables.TIME_STEP;
  }*/

  app.physics.leapFrog();
};


ViewPort.prototype.setClock = function() {
  app.CLOCK.ticks += 1;
  app.CLOCK.e += app.particles[3].checkClock() ? 1 : 0;
  app.CLOCK.j += app.particles[5].checkClock() ? 1 : 0;
  app.CLOCK.n += app.particles[7].checkClock() ? 1 : 0; 

  if(app.CLOCK.ticks > 1000000) {
    app.CLOCK.ticks = 0;
  }
};

ViewPort.prototype.setIntegrate = function() {
  app.viewPort.center = {x: (app.particles[app.FOLLOW].x - app.halfWidth), y: (app.particles[app.FOLLOW].y - app.halfHeight)};
  for (i = 0; i < app.particles.length; i++) {
    //current = app.particles[i];
    //current.x = current.newX;
    //current.y = current.newY;
    app.particles[i].draw();
  }
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

  app.viewPort.viewPortSize = (app.width / (app.VIEWSHIFT.zoom + 1)) / app.physics.constants.ASTRONOMICAL_UNIT;
  app.viewPort.viewPortSizeInKm = app.physics.constants.KM_PER_AU * app.viewPort.viewPortSize;

};
