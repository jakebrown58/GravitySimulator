function Vector3d(x, y, z){
	this.x = x;
	this.y = y;
	this.z = z;
}

Vector3d.prototype.setXYZ = function(x, y, z){
	this.x = x;
	this.y = y;
	this.z = z;
};

Vector3d.prototype.setFromV = function(v){
	this.x = v.x;
	this.y = v.y;
	this.z = v.z;
};

Vector3d.prototype.asXYZ = function(){
	return { x: this.x,
			y: this.y,
			z: this.z}
};

Vector3d.prototype.zero = function(){
    this.setXYZ(0., 0., 0.);
}


Vector3d.prototype.sumsq = function(){
	//The cheapest "size" measure of a vector.
	return  this.x*this.x +
			this.y*this.y +
			this.z*this.z;
};

Vector3d.prototype.magnitude = function(){
	return Math.sqrt(this.sumsq());
}


Vector3d.prototype.dot = function(v){
	return  this.x*v.x + 
			this.y*v.y + 
			this.z*v.z;
};

Vector3d.prototype.dist_squared = function(v){
	var dx, dy, dz;
	dx = this.x - v.x;
	dy = this.y - v.y;
	dz = this.z - v.z;
	return dx*dx + dy*dy + dz*dz;
};

Vector3d.prototype.distance = function(v){
	return Math.sqrt(this.dist_squared(v));
};

Vector3d.prototype.dist_cubed = function(v){
	var d = this.distance(v);
	return d*d*d;
};

Vector3d.prototype.rOverRCubed_in_place = function(){
	//Takes a vector and _overwrites_ it with r_vector/r^3
	//This is exactly the gravity vector dependence.
	var r_sq = this.sumsq();
	var r_cubed = r_sq * Math.sqrt(r_sq);
	this.x /= r_cubed;
	this.y /= r_cubed;
	this.z /= r_cubed;
}

Vector3d.prototype.FasterSqrt = function(xsq){
	//No Error Checking whatsoever.  Also, not optimized yet, so do not expect actual speed yet.
	var Numbuffer = new ArrayBuffer(4); //Bytes; float's typical size.
	var f32View = new Float32Array(Numbuffer);
	var bitsView = new Uint32Array(Numbuffer);
	var one = new ArrayBuffer(4);
	var float32_one = new Float32Array(one);
	var bits_one = new Uint32Array(one);
    
    float32_one[0] = 1.;

	f32View[0] = xsq;
	bitsView[0] = (bitsView[0] + bits_one[0]) / 2;

	x = f32View[0];
	x = (x+xsq/x) / 2.
	return (x+xsq/x)/2;
}


Vector3d.prototype.increment = function(v){
	this.x += v.x;
	this.y += v.y;
	this.z += v.z;
};

Vector3d.prototype.decrement = function(v){
	this.x -= v.x;
	this.y -= v.y;
	this.z -= v.z;
};

Vector3d.prototype.scale = function(a){
	this.x *= a;
	this.y *= a;
	this.z *= a;
};

Vector3d.prototype.unitRandom = function(){
	// Randomly directed uniformly over sphere.
	var costheta = 2 * Math.random() - 1.;
	var sintheta = Math.sqrt(1. - costheta*costheta);
	var phi = 2*Math.PI*Math.random();
	return new Vector3d(Math.cos(phi)*sintheta, Math.sin(phi)*sintheta, costheta);
};

Vector3d.prototype.randomOfMagnitude = function(magnitude){
	//Randomly directed, but fixed magnitude:
	var u = Vector3d.prototype.unitRandom();
	u.scale(magnitude);
	return u;
};


Vector3d.prototype.unitFromAngles = function(theta, phi){
	// Phi is the angle in the x-y plane (called azimuth, like longitude)
	// theta is the angle from the north celestial pole (like latitude, but starts at 0 at pole)
	costheta = Math.cos(theta);
	sintheta = Math.sin(theta);
	cosphi = Math.cos(phi);
	sinphi = Math.sin(phi);
	u = new Vector3d(cosphi*sintheta, sinphi*sintheta,costheta);
	return u;
};

Vector3d.prototype.unitVector = function(){
	var u =Vector3d(this.x, this.y, this.z);
	u.scale(1. / this.magnitude());
	return u;
};

Vector3d.prototype.angles = function(){
	//Should I set these and carry them around?... No?
	v = this.unitVector();
	theta = Math.acos(v.z);
	phi   = Math.atan2(v.y, v.x);
	return [theta, phi];
};

Vector3d.prototype.phi = function(){
	//Azimuthal angle.
	//Extremely cheap relative to getting both theta and phi.
	return Math.atan2(this.y, this.x);
};

Vector3d.prototype.theta = function(){
	//Theta meaured from north pole.
	// This method avoids a Math.sqrt() call.
	
	if (this.z == 0) {
		return Math.PI / 2.;
	}else{
		var sgn = this.z / abs(this.z);
		//Since cos(x)**2 = 1/2 (cos(2 x)+1)
		cos_sq_theta = this.z*this.z/ this.sumsq();
		abstheta = Math.acos(2. * cos_sq_theta - 1.) / 2.;
		return sgn * abstheta;
	}
};

Vector3d.prototype.cross = function(v2){
	v1Xv2 = new Vector3d(this.y*v2.z - this.z*v2.y,
						-this.x*v2.z + this.z*v2.x,
						 this.x*v2.y - this.y*v2.x);
	return v1Xv2;
};

Vector3d.prototype.projectPlane = function(plane){
	//Plane is a Vector3d perpendicular to that plane.
	var projectedV = new Vector3d(this.x, this.y, this.z);
	var z = plane.dot(projectedV);
	projectedV.x -= z * plane.x;
	projectedV.y -= z * plane.y;
	projectedV.z -= z * plane.z;
	return projectedV;
};