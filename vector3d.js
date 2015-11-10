function Vector3d(){};

Vector3d.make = function(x,y,z)
{
	var tView = Float64Array;
	var b = new ArrayBuffer(3 * tView.BYTES_PER_ELEMENT);
	var v = new tView(b, 0, 3);
	v[0] = x;
	v[1] = y;
	v[2] = z;
	return v; //v remembers its buffer and type.
};

Vector3d.zero = function(v){
	for(var i=0;i<v.length;i++){
		v[i] = 0;
	}
};

Vector3d.sumsq = function(v){
	//The cheapest "size" measure of a vector.
	var x = 0;
	for(var i=0;i<v.length;i++){
		x += v[i]*v[i];
	}	
	return x;
};


Vector3d.magnitude = function(v){
	return Math.sqrt(Vector3d.sumsq(v));
};

Vector3d.dot = function(v1, v2){
	var x = 0;
	for(var i=0;i<v1.length;i++){
		x += v1[i]*v2[i];
	}
	return x;
};

Vector3d.distSquared = function(v1, v2){
	var x = 0;
	var delta;
	for(var i=0;i<v1.length;i++){
		delta = v1[i] - v2[i];
		x += delta*delta;
	}
	return x;
};

Vector3d.distance = function(v1, v2){
	return Math.sqrt(Vector3d.distSquared(v1, v2));
};

Vector3d.increment = function(v, dv){
	for(var i=0;i<v.length;i++){
		v[i] += dv[i];
	}
};

Vector3d.decrement = function(v, dv){
	for(var i=0;i<v.length;i++){
		v[i] -= dv[i];
	}
};

Vector3d.scale = function(v, a){
	for(var i=0;i<v.length;i++){
		v[i] *= a;
	}
};

Vector3d.randomizeDirection = function(v){
	// Randomly directed uniformly over sphere.
	var costheta = 2 * Math.random() - 1.;
	var sintheta = Math.sqrt(1. - costheta*costheta);
	var phi = 2*Math.PI*Math.random();
	v.set([Math.cos(phi)*sintheta,
		   Math.sin(phi)*sintheta,
		   costheta]);
};

Vector3d.randomizeWithMagnitude = function(v, magnitude){
	//Randomly directed, but fixed magnitude:
	Vector3d.randomizeDirection(v);
	Vector3d.scale(v, magnitude);
};


Vector3d.unitFromAngles = function(v, theta, phi){
	// Phi is the angle in the x-y plane (called azimuth, like longitude)
	// theta is the angle from the north celestial pole (like latitude, but starts at 0 at pole)
	costheta = Math.cos(theta);
	sintheta = Math.sqrt(1-costheta*costheta); //Guaranteed positive.
	cosphi = Math.cos(phi);
	sinphi = Math.sin(phi);
	v.set([sintheta * cosphi,
     	   sintheta * sinphi,
		   costheta]);
};

Vector3d.unitVector = function(v){
	Vector3d.scale(v, 1 / Vector3d.magnitude(v));
};

Vector3d.angles = function(v){
	magnitude = Vector3d.magnitude(v);
	theta = Math.acos(v.z/magnitude);
	phi   = Math.atan2(v.y, v.x);
	return [theta, phi];
};

Vector3d.phi = function(v){
	//Azimuthal angle.
	//Extremely cheap relative to getting both theta and phi.
	return Math.atan2(v[1], v[0]);
};

Vector3d.theta = function(v){
	//Theta meaured from north pole.
	// This method avoids a Math.sqrt() call.
	
	if (v[2] == 0) {
		return Math.PI / 2.;
	}else{
		var sgn = v[2] / abs(v[2]);
		//Since cos(x)**2 = 1/2 (cos(2 x)+1)
		cos_sq_theta = v[2]*v[2] / Vector3d.sumsq(v);
		abstheta = Math.acos(2. * cos_sq_theta - 1.) / 2.;
		return sgn * abstheta;
	}
};
