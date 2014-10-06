/* ******************* RESPONSE ******************************************************* */

function Response() {
  app.eventListener.addEventListener('mousemove', this.onMousemove);
  app.eventListener.addEventListener('click', this.onClick);
  app.eventListener.addEventListener('keydown', this.onKeyDown);
  this.MODE = 'FOLLOW';
}

Response.prototype.onMouseMove = function() {
    var up = app.mouse.y > e.clientY;

    app.VIEWANGLE = up ? app.VIEWANGLE + Math.PI / 32 : app.VIEWANGLE - Math.PI / 32;

    if(app.VIEWANGLE < 0) {
      app.VIEWANGLE = 0;
    }
    if(app.VIEWANGLE > Math.PI / 2) {
      app.VIEWANGLE = Math.PI / 2;
    }

    app.mouse.x = e.clientX;
    app.mouse.y = e.clientY;
};

Response.prototype.changeMode = function() {
  if(app.response.MODE === 'FOLLOW') {
    app.response.MODE = 'ROCKET';
  } else if( this.MODE === 'ROCKET') {
    app.response.MODE = 'PHOTON';
  } else if( this.MODE === 'PHOTON') {
    app.response.MODE = 'DESTROY';
  } else {
    app.response.MODE = 'FOLLOW';
  }
};

Response.prototype.onKeyDown = function(e) {
    if(e.keyCode === 86) {    // v
      app.DRAWSTATE += 1;

      if(app.DRAWSTATE === 3) {
        app.DRAWSTATE = 0;
      }
      app.ctx.clearRect(0, 0, app.width, app.height);
    }
    if(e.keyCode === 32) {    // ' '
      app.TRACE = !app.TRACE;
    }
    if(e.keyCode === 82) {    // 'R'
      if(app.physics.variables.CALC_STYLE !== 'real') {
        app.physics.variables.CALC_STYLE = 'real';
      } else {
        app.physics.variables.CALC_STYLE = 'wacky';
//        app.physics.variables.CALC_STYLE_VELOCITY_MOD = Math.floor(Math.random() * 10) + 1;
      }
      app.ctx.clearRect(0, 0, app.width, app.height);
      var x = new Particles().buildInitialParticles();
      app.viewPort.colorSorted = false;
      app.CLOCK.ticks = 0;
      app.CLOCK.e = 0;
      app.CLOCK.j = 0;
      app.CLOCK.n = 0;
    }
    if(e.keyCode === 84) {    // 'T'
      app.physics.reverseTime();
    } 
    if(e.keyCode === 87) {    // 'W'
      app.VIEWSHIFT.y -= 5;
      //app.particles[app.FOLLOW].vely -= .1;
    }
    if(e.keyCode === 83) {    // 'S'
      app.VIEWSHIFT.y += 5;
      //app.particles[app.FOLLOW].vely += .1;
    }
    if(e.keyCode === 65) {    // 'A'
      app.VIEWSHIFT.x -= 5;
      //app.particles[app.FOLLOW].velx -= .1;
    }
    if(e.keyCode === 68) {    // 'D'
      app.VIEWSHIFT.x += 5;
      //app.particles[app.FOLLOW].velx += .1;
    }      
    if(e.keyCode === 77) {    // 'M'
      app.response.changeMode();
    }    
    if(e.keyCode === 80) {    // 'P'
      app.physics.updateTimeStep(1);
      if(app.GO === false) {
        app.GO = true;
        requestAnimationFrame(app.viewPort.frame);
        app.CLOCK.ticks = 0;
        app.splitTime = new Date();
      } else {
        app.GO = false;
      }
    }  
    if(e.keyCode === 67) {    // 'C'
      app.SHOWCLOCK = !app.SHOWCLOCK;
    }        
    if(e.keyCode === 70) {    // 'F'
      app.FOLLOW += 1;
      app.VIEWSHIFT.x = 0;
      app.VIEWSHIFT.y= 0;
      if(app.FOLLOW >= app.PARTICLECOUNT) {
        app.FOLLOW = 0;
      }
    } 
    if(e.keyCode === 88) {    // 'X'
      if(app.physics.variables.TIME_STEP < 100) {
        app.physics.updateTimeStep(app.physics.variables.TIME_STEP * 2);
      }
    }
    if(e.keyCode === 90) {    // 'Z'
      app.physics.updateTimeStep(app.physics.variables.TIME_STEP / 2);
    }
    if(e.keyCode === 188) {    // '<'
      app.viewPort.adjustZoom('out');
    }
    if(e.keyCode === 190) {    // '>'
      app.viewPort.adjustZoom('in');
    }    
    if(e.keyCode === 72) {    // 'H'
      app.VIEWSHIFT.x = 0;
      app.VIEWSHIFT.y= 0;
      app.VIEWANGLE = .75;
      app.FOLLOW = 0;
      app.VIEWSHIFT.zoom = 0;
      app.physics.updateTimeStep(1);
    }  
};

Response.prototype.onClick = function(e) {
    var xy = {x: e.clientX, y: e.clientY};

    if(app.response.MODE === 'FOLLOW') {
      app.response.follow(xy);
    } else if(app.response.MODE === 'DESTROY') {
      app.response.destroy(xy);
    } else {
      app.response.rocket();
    }
};

Response.prototype.follow = function(xy){
    var j = 0,
      curr,
      currIndex = 0,
      currLoc = {x: 0, y: 0},
      currDist = 10000000000000000000,
      tmpDist;

    for(j = 0; j < app.particles.length; j++ ) {
      curr = app.particles[j];
      currLoc.x = (curr.x - app.viewPort.center.x) + (curr.x - app.particles[app.FOLLOW].x) * app.VIEWSHIFT.zoom;
      currLoc.y = (curr.y - app.viewPort.center.y) + (curr.y - app.particles[app.FOLLOW].y) * app.VIEWSHIFT.zoom;
      tmpDist = (currLoc.x - xy.x) * (currLoc.x - xy.x) + (currLoc.y - xy.y) * (currLoc.y - xy.y);
      if(tmpDist < currDist ){
        currDist = tmpDist;
        currIndex = j;
      }
    }

    app.FOLLOW = currIndex;
};

Response.prototype.destroy = function(xy){
    var j = 0,
      curr,
      currIndex = 0,
      currLoc = {x: 0, y: 0},
      currDist = 10000000000000000000,
      tmpDist;

    for(j = 0; j < app.particles.length; j++ ) {
      curr = app.particles[j];
      currLoc.x = (curr.x - app.viewPort.center.x) + (curr.x - app.particles[app.FOLLOW].x) * app.VIEWSHIFT.zoom;
      currLoc.y = (curr.y - app.viewPort.center.y) + (curr.y - app.particles[app.FOLLOW].y) * app.VIEWSHIFT.zoom;
      tmpDist = (currLoc.x - xy.x) * (currLoc.x - xy.x) + (currLoc.y - xy.y) * (currLoc.y - xy.y);
      if(tmpDist < currDist ){
        currDist = tmpDist;
        currIndex = j;
      }
    }

    var tmp = [];
    for(var j = 0; j < app.particles.length; j++) {
      if(j != currIndex) {
        tmp.push(app.particles[j]);
      }
    }

    app.particles = tmp;

    if(app.FOLLOW == currIndex) {
      app.FOLLOW = 0;
    }
};

Response.prototype.rocket = function(){
  var x = new Particles().buildParticle({name: 'ROCKET!! ' + app.particles.length, mass: 1/ 1500000000, orbitalVelocity: 0.08 - Math.random() * .08, arc: Math.PI / 2, distance: app.physics.constants.ASTRONOMICAL_UNIT * 2, drawSize: .1}),
    newGuy = app.particles[app.particles.length -1];

  if(app.response.MODE === 'PHOTON') {
    newGuy.name = 'PHOTON' + app.particles.length;
    newGuy.mass = 0;
    var arc = 0;//Math.random() * 2 * Math.PI;
    newGuy.x = app.particles[0].x;
    newGuy.y = app.particles[0].y;
    newGuy.velx = 5000 * Math.cos(arc);
    newGuy.vely = 5000 * Math.sin(arc);

  } else {
    newGuy.x = app.particles[app.FOLLOW].x - Math.random() * .10 + Math.random() * .20;
    newGuy.y = app.particles[app.FOLLOW].y - Math.random() * .10 + Math.random() * .20;
    newGuy.velx = app.particles[app.FOLLOW].velx + Math.random() * .32;
    newGuy.vely = app.particles[app.FOLLOW].vely + Math.random() * .32;
  }
  
  app.PARTICLECOUNT = app.particles.length - 1;

    // if(app.particles.PARTICLECOUNT > 30) {
    //   var tmp = [];
    //   for(var j = 0; j < app.particles.length; j++) {
    //     if(j != 13) {
    //       tmp.push(app.particles[j]);
    //     }
    //   }

    //   app.particles = tmp;
    // }
};
