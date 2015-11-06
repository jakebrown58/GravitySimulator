function Thrust() {
  this.heading = 0;
  this.thrust = 0;
  this.burning = false;
}

Thrust.prototype.act = function(action) {
  var me = this;
  if(action === 'rocketEnginesBurnToggle') { me.toggleBurn(); }
  if(action === 'rocketRotateLeft') { me.updateHeading(-2); }
  if(action === 'rocketRotateRight') { me.updateHeading(2); }
  if(action === 'rocketIncreaseThrust') { me.updateThrust(1); }
}

Thrust.prototype.updateHeading = function(headingAdjustment) {
  this.heading += headingAdjustment;

  if(this.heading > 360) {
    this.heading = 0;
  }
  if(this.heading < 0) {
    this.heading = 360;
  }
}

Thrust.prototype.getThrustVector = function() {
  if(!this.burning) {
    return {x: 0, y:0};
  }


  return { 
    x: this.thrust * Math.cos(Math.PI * this.heading / 180),
    y: this.thrust * Math.sin(Math.PI * this.heading / 180)
  };
}

Thrust.prototype.updateThrust = function(thrustAdjustment) {
  this.thrust += thrustAdjustment;
}

Thrust.prototype.toggleBurn = function() {
  this.burning = !this.burning;

  if(!this.burning) {
    this.thrust= 0;
  }
}