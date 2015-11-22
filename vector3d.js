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
	return new Vector3d(r*Math.sin(theta)*Math.cos(phi), r*Math.sin(theta)*Math.sin(phi), r*Math.cos(theta));
};

Vector3d.prototype.setRThetaPhi = function (r, theta, phi){
	this.x = r * Math.sin(theta) * Math.cos(phi);
	this.y = r * Math.sin(theta) * Math.sin(phi);
	this.z = r * Math.cos(theta);
};

Vector3d.prototype.asRThetaPhi = function(){
	return {r:this.magnitude(), theta:this.theta(), phi:Math.atan2(this.y, this.x)};
};

Vector3d.prototype.setFromV = function(v){
	this.x = v.x;
	this.y = v.y;
	this.z = v.z;
};

Vector3d.prototype.zeroMe = function(){
    this.x = 0;
    this.y = 0;
    this.z = 0;
};

Vector3d.prototype.sumSquares = function(){
	//The cheapest "size" measure of a vector.
	return  this.x*this.x +
			this.y*this.y +
			this.z*this.z;
};

Vector3d.prototype.magnitude = function(){
	return Math.sqrt(this.sumSquares());
};

Vector3d.prototype.theta = function(){
	//Theta meaured from north pole.
	// This method avoids a Math.sqrt() call.

	if (this.z === 0) {
		return Math.PI / 2;
	}else{
		var zPositive = this.z > 0;
		//Since cos(x)**2 = 1/2 (cos(2 x)+1)
		var theta = Math.acos(2 * this.z*this.z/this.sumSquares() - 1) / 2;
		if(zPositive){
			return theta;
		}else{
			return Math.PI - theta;
		}
	}
};

Vector3d.prototype.phi = function(){
	//Azimuthal angle.
	//Extremely cheap relative to getting both theta and phi.
	return Math.atan2(this.y, this.x);
};

Vector3d.prototype.dot = function(v){
	return  this.x*v.x +
			this.y*v.y +
			this.z*v.z;
};

Vector3d.prototype.distSquared = function(v){
	var dx, dy, dz;
	dx = this.x - v.x;
	dy = this.y - v.y;
	dz = this.z - v.z;
	return dx*dx + dy*dy + dz*dz;
};

Vector3d.prototype.distance = function(v){
	return Math.sqrt(this.distSquared(v));
};

Vector3d.prototype.distCubed = function(v){
	var d = this.distance(v);
	return d*d*d;
};

Vector3d.prototype.rOverRCubed_in_place = function(){
	//Takes a vector and _overwrites_ it with r_vector/r^3
	//This is exactly the gravity vector dependence.
	var rSq = this.sumSquares();
	var rCubed = rSq * Math.sqrt(rSq);
	this.x /= rCubed;
	this.y /= rCubed;
	this.z /= rCubed;
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

Vector3d.prototype.unitRandom = function(){
	// Randomly directed uniformly over sphere.
	var costheta = 2 * Math.random() - 1;
	var sintheta = Math.sqrt(1 - costheta*costheta);
	var phi = Math.TAU * Math.random();
	return new Vector3d(Math.cos(phi)*sintheta, Math.sin(phi)*sintheta, costheta);
};

Vector3d.prototype.randomOfMagnitude = function(magnitude){
	//Randomly directed, but fixed magnitude:
	var u = Vector3d.prototype.unitRandom();
	return u.scaleMe(magnitude);
};

Vector3d.prototype.unitFromAngles = function(theta, phi){
	// Phi is the angle in the x-y plane (called azimuth, like longitude)
	// theta is the angle from the north celestial pole (like latitude, but starts at 0 at pole)
	return Vector3d.prototype.fromRThetaPhi(1, theta, phi);
};

Vector3d.prototype.unitMe = function(){
	return this.scale(1 / this.magnitude());
};

Vector3d.prototype.unitVector = function(){
	var l = this.magnitude();
	if (l === 0){
		return this.copy();
	}else{
		return this.copy().scale(1 / l );
	}
};

Vector3d.prototype.openingAngle_UnitDot = function(v2){
	var u1 = this.unitVector();
	var u2 = v2.unitVector();

	return Math.acos(u1.dot(u2));
};

Vector3d.prototype.openingAngle_UnitLawOfCosines = function(v2){
	var u1 = this.unitVector();
	var u2 = v2.unitVector();
	var oppositeSide = u1.decrementMe(u2);
	return Math.acos(1 - oppositeSide.sumSquares()/2);
};

Vector3d.prototype.openingAngle_DotOnly = function(v2){
	//Opening Angle refers to the angle between two vectors placed tail to tail.
	var v1DotV2 = this.dot(v2);
	if(v1DotV2 === 0){
		return Math.PI/2;
	}else{
		v1DotV2 /= (v2.magnitude() * this.magnitude());
		if (Math.abs(v1DotV2) > 1){
			if(v1DotV2 > 1){
				return 0;
			}else{
				return Math.PI;
			}
		}else{
		  return Math.acos(v1DotV2);
		}
	}
};

Vector3d.prototype.openingAngle_LawCosines = function(v2){
	//Opening Angle refers to the angle between two vectors placed tail to tail.
	var oppositeSide = this.copy().decrementMe(v2);
	var length1 = this.magnitude();
	var length2 = v2.magnitude();
	var costheta = (oppositeSide.sumSquares() - this.sumSquares() - v2.sumSquares())/(2*length1*length2);
	return Math.acos(costheta);
};

Vector3d.prototype.openingAngle = Vector3d.prototype.openingAngle_UnitLawOfCosines;

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

Vector3d.prototype.toString = function(){
	return ("Vector3d(" + this.x.toPrecision(3) + ", " + this.y.toPrecision(3) + ", " + this.z.toPrecision(3) + ")");
};

//Compatibility with old API:
Vector3d.prototype.scale = Vector3d.prototype.scaleMe;
Vector3d.prototype.sumsq = Vector3d.prototype.sumSquares;
Vector3d.prototype.zero = Vector3d.prototype.zeroMe;
Vector3d.prototype.increment = Vector3d.prototype.incrementMe;
Vector3d.prototype.decrement = Vector3d.prototype.decrementMe;
Vector3d.prototype.dist_squared = Vector3d.prototype.distSquared;

Vector3d.prototype.rotateAbout = function(axisOfRotation, angleOfRotation){
	return this.rotateMe({pivotPoint:new Vector3d(0, 0, 0), axis:axisOfRotation, angle:angleOfRotation});
};


