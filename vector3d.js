Array.prototype.v_dot = function(v){
	return this[0]*v[0] + this[1]*v[1] + this[2]*v[2];
};

Array.prototype.v_sumsq = function(){
	return this.v_dot(this);
};

Array.prototype.v_length = function(){
	return Math.sqrt(this.v_sumsq());
};

Array.prototype.v_dist2to = function(v){
	return [this[0] - v[0],
			this[1] - v[1],
			this[2] - v[2] ].v_sumsq();
};

Array.prototype.v_distanceto = function(v){
	return Math.sqrt(this.v_dist2to(v));
};

Array.prototype.v_dist3to = function(v){
	return this.v_distanceto(v)*this.v_distanceto(v)*this.v_distanceto(v);
};


Array.prototype.v_lencube = function(){
	return this.v_length() * this.v_sumsq();
};

Array.prototype.v_add = function(v, result){
	result[0] = this[0] + v[0];
	result[1] = this[1] + v[1];
	result[2] = this[2] + v[2];
};

Array.prototype.v_inc_by = function(v){
	this[0] += v[0];
	this[1] += v[1];
	this[2] += v[2];
};

Array.prototype.v_dec_by = function(v){
	this[0] -= v[0];
	this[1] -= v[1];
	this[2] -= v[2];
};

Array.prototype.v_minus = function(v, result){
	result[0] = this[0] - v[0];
	result[1] = this[1] - v[1];
	result[2] = this[2] - v[2];
};

Array.prototype.v_scale = function(a){
	this[0] *= a;
	this[1] *= a;
	this[2] *= a;
};

Array.prototype.unitRandom = function(){
	// Randomly directed uniformly over sphere.
	var costheta = 2 * Math.random() - 1.;
	var sintheta = Math.sqrt(1. - costheta*costheta);
	var phi = 2*Math.PI*Math.random();
	return [Math.cos(phi)*sintheta,
	 		Math.sin(phi)*sintheta, 
	 		costheta];
};

Array.prototype.lRandom = function(l){
	//Randomly directed, of length x
	v = [].unitRandom();
	v.v_scale(l);
	return v;
};