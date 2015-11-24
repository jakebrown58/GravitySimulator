Math.TAU = Math.TAU || 2 * Math.PI;

function Vector3d(x, y, z){
	this.x = x;
	this.y = y;
	this.z = z;
}

Vector3d.prototype.copy = function(v){
	return new Vector3d(this.x, this.y, this.z);
};

Vector3d.prototype.setXYZ = function(x, y, z){
	this.x = x;
	this.y = y;
	this.z = z;
};

Vector3d.prototype.asXYZ = function(){
	return {x: this.x,
			y: this.y,
			z: this.z};
};

Vector3d.prototype.fromRThetaPhi = function(r, theta, phi){
	return new Vector3d(
		r * Math.sin(theta) * Math.cos(phi), 
		r * Math.sin(theta) * Math.sin(phi), 
		r * Math.cos(theta)
		);
};

Vector3d.prototype.setRThetaPhi = function (r, theta, phi){
	this.x = r * Math.sin(theta) * Math.cos(phi);
	this.y = r * Math.sin(theta) * Math.sin(phi);
	this.z = r * Math.cos(theta);
};

Vector3d.prototype.asRThetaPhi = function(){
	return {r:this.getMagnitude(), theta:this.getTheta(), phi:Math.atan2(this.y, this.x)};
};

Vector3d.prototype.setVector = function(v){
	this.x = v.x;
	this.y = v.y;
	this.z = v.z;
};

Vector3d.prototype.zeroMe = function(){
    this.x = 0;
    this.y = 0;
    this.z = 0;
};

Vector3d.prototype.getSumSquares = function(){
	//The cheapest "size" measure of a vector.
	return  this.x*this.x +
			this.y*this.y +
			this.z*this.z;
};

Vector3d.prototype.getMagnitude = function(){
	return Math.sqrt(this.getSumSquares());
};

Vector3d.prototype.getTheta = function(){
	//Theta meaured from north pole.
	// This method avoids a Math.sqrt() call.

	if (this.z === 0) {
		return Math.PI / 2;
	}else{
		var zPositive = this.z > 0;
		//Since cos(x)**2 = 1/2 (cos(2 x)+1)
		var theta = Math.acos(2 * this.z*this.z/this.getSumSquares() - 1) / 2;
		if(zPositive){
			return theta;
		}else{
			return Math.PI - theta;
		}
	}
};

Vector3d.prototype.getPhi = function(){
	//Azimuthal angle.
	//Extremely cheap relative to getting both theta and phi.
	return Math.atan2(this.y, this.x);
};

Vector3d.prototype.dot = function(v){
	return  this.x*v.x +
			this.y*v.y +
			this.z*v.z;
};

Vector3d.prototype.getDistSquared = function(v){
	var dx, dy, dz;
	dx = this.x - v.x;
	dy = this.y - v.y;
	dz = this.z - v.z;
	return dx*dx + dy*dy + dz*dz;
};

Vector3d.prototype.getDistance = function(v){
	return Math.sqrt(this.getDistSquared(v));
};

Vector3d.prototype.getDistCubed = function(v){
	var d = this.getDistance(v);
	return d*d*d;
};

Vector3d.prototype.incrementMe = function(v){
	this.x += v.x;
	this.y += v.y;
	this.z += v.z;
	return this;
};

Vector3d.prototype.decrementMe = function(v){
	this.x -= v.x;
	this.y -= v.y;
	this.z -= v.z;
	return this;
};

Vector3d.prototype.scaleMe = function(a){
	this.x *= a;
	this.y *= a;
	this.z *= a;
	return this;
};

Vector3d.prototype.generateRandomUnitVector = function(){
	// Randomly directed uniformly over sphere.
	var costheta = 2 * Math.random() - 1;
	var sintheta = Math.sqrt(1 - costheta*costheta);
	var phi = Math.TAU * Math.random();
	return new Vector3d(Math.cos(phi)*sintheta, Math.sin(phi)*sintheta, costheta);
};

Vector3d.prototype.generateRandomVector = function(magnitude){
	//Randomly directed, but fixed magnitude:
	var u = Vector3d.prototype.generateRandomUnitVector();
	return u.scaleMe(magnitude);
};

Vector3d.prototype.unitFromAngles = function(theta, phi){
	// Phi is the angle in the x-y plane (called azimuth, like longitude)
	// theta is the angle from the north celestial pole (like latitude, but starts at 0 at pole)
	return Vector3d.prototype.fromRThetaPhi(1, theta, phi);
};

Vector3d.prototype.unitMe = function(){
	var magnitude = this.getMagnitude();
	if (magnitude === 0){
		return this;
	}else{
		return this.scale(1 / magnitude );
	}
};

Vector3d.prototype.unitVector = function(){
	return this.copy().unitMe();
};

Vector3d.prototype.getOpeningAngle = function(v2){
	var u1 = this.unitVector();
	var u2 = v2.unitVector();
	var oppositeSide = u1.decrementMe(u2);
	return Math.acos(1 - oppositeSide.getSumSquares()/2);
};

Vector3d.prototype.cross = function(v2){
	v1Xv2 = new Vector3d(this.y*v2.z - this.z*v2.y,
						-this.x*v2.z + this.z*v2.x,
						 this.x*v2.y - this.y*v2.x);
	return v1Xv2;
};

Vector3d.prototype.rotateMe = function(rotation){
	if (rotation.pivotPoint) this.decrementMe(rotation.pivotPoint);

	var uRotationAxis = rotation.axis.unitVector();

    var vAxial = this.projectOntoAxis(uRotationAxis);

    var vPlaneParallel = this.projectOntoPlane(uRotationAxis);
    vPlaneParallel.scaleMe(Math.cos(rotation.angle));

    var vPlanePerp = uRotationAxis.cross(this);
    vPlanePerp.scaleMe(Math.sin(rotation.angle));

    this.setFromV(vAxial);
    this.incrementMe(vPlaneParallel);
    this.incrementMe(vPlanePerp);

    if (rotation.pivotPoint) this.incrementMe(rotation.pivotPoint);
    return this;
};

Vector3d.prototype.projectOntoAxis = function(axis){
	return axis.copy().scaleMe(axis.dot(this));
};

Vector3d.prototype.projectOntoPlane = function(plane){
	//plane is a Vector3d perpendicular to that plane.
	var projectedV = new Vector3d(this.x, this.y, this.z);
	//Subtract off the part of the vector perpendicular to the plane:
	projectedV.decrementMe(this.projectOntoAxis(plane));
	return projectedV;
};

Vector3d.prototype.asString = function(){
	return ("Vector3d(" + this.x.toPrecision(3) + ", " + this.y.toPrecision(3) + ", " + this.z.toPrecision(3) + ")");
};

//Compatibility with old API:
Vector3d.prototype.scale = Vector3d.prototype.scaleMe;
Vector3d.prototype.sumsq = Vector3d.prototype.getSumSquares;
Vector3d.prototype.zero = Vector3d.prototype.zeroMe;
Vector3d.prototype.increment = Vector3d.prototype.incrementMe;
Vector3d.prototype.decrement = Vector3d.prototype.decrementMe;
Vector3d.prototype.dist_squared = Vector3d.prototype.getDistSquared;
Vector3d.prototype.phi = Vector3d.prototype.getPhi;
Vector3d.prototype.theta = Vector3d.prototype.getTheta;
Vector3d.prototype.magnitude = Vector3d.prototype.getMagnitude;
Vector3d.prototype.distance = Vector3d.prototype.getDistance;
Vector3d.prototype.setFromV = Vector3d.prototype.setVector;

Vector3d.prototype.rotateAbout = function(axisOfRotation, angleOfRotation){
	return this.rotateMe({pivotPoint:new Vector3d(0, 0, 0), axis:axisOfRotation, angle:angleOfRotation});
};


