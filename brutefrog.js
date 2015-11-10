function BruteFrog(MaxNumParticles){
//This implements the brute force algorithm, O(N_vector ^ 2);
//Vector3d should pull from this kinematics buffer.
//And Particle will therefore see this transparently.
	this.MaxNumParticles = MaxNumParticles;
	var tView            = Float64Array;
	var rowSize          = this.MaxNumParticles * tView.BYTES_PER_ELEMENT;
	this.b               = new ArrayBuffer(23 * rowSize);
	this.allrows         = new tView(this.b, 0);
	
	this.N = 0; //No Particles.

	var NMax = MaxNumParticles;
	var row_offset=0;
	// this.positions   = new tView(this.b,  row_offset * rowSize, 3*NMax);
	this.positions_x = new tView(this.b, (row_offset++) * rowSize, NMax);
	this.positions_y = new tView(this.b, (row_offset++) * rowSize, NMax);
	this.positions_z = new tView(this.b, (row_offset++) * rowSize, NMax);

	// this.vels        = new tView(this.b,  row_offset * rowSize, 3*NMax);
	this.vels_x      = new tView(this.b, (row_offset++) * rowSize, NMax);
	this.vels_y      = new tView(this.b, (row_offset++) * rowSize, NMax);
	this.vels_z      = new tView(this.b, (row_offset++) * rowSize, NMax);

	// this.accs        = new tView(this.b,  row_offset * rowSize, 3*NMax);
	this.accs_x      = new tView(this.b, (row_offset++) * rowSize, NMax);
	this.accs_y      = new tView(this.b, (row_offset++) * rowSize, NMax);
	this.accs_z      = new tView(this.b, (row_offset++) * rowSize, NMax);

	// this.accs_old    = new tView(this.b,  row_offset * rowSize, 3*NMax);
	this.accs_old_x  = new tView(this.b, (row_offset++) * rowSize, NMax);
	this.accs_old_y  = new tView(this.b, (row_offset++) * rowSize, NMax);
	this.accs_old_z  = new tView(this.b, (row_offset++) * rowSize, NMax);

	this.masses      = new tView(this.b, (row_offset++)*rowSize, NMax);
	this.dts         = new tView(this.b, (row_offset++)*rowSize, NMax);

	//Things below this will be per pair,
	//Values not guaranteed meaningful outside of integration routine.


	// this.accs_Swap   = this.accs;
	this.accs_Swap_x = this.accs_x;
	this.accs_Swap_y = this.accs_y;
	this.accs_Swap_z = this.accs_z;

	// this.tmp_accs    = new tView(this.b,  row_offset * rowSize, 3*NMax);
	this.tmp_accs_x  = new tView(this.b, (row_offset++) * rowSize, NMax);
	this.tmp_accs_y  = new tView(this.b, (row_offset++) * rowSize, NMax);
	this.tmp_accs_z  = new tView(this.b, (row_offset++) * rowSize, NMax);

	this.tmp_accel_mags  = new tView(this.b, (row_offset++)*rowSize, NMax);

	// this.delta_rs    = new tView(this.b,  row_offset * rowSize, 3*NMax);
	this.delta_rs_x  = new tView(this.b, (row_offset++) * rowSize, NMax);
	this.delta_rs_y  = new tView(this.b, (row_offset++) * rowSize, NMax);
	this.delta_rs_z  = new tView(this.b, (row_offset++) * rowSize, NMax);

	this.dsquares    = new tView(this.b, (row_offset++)*rowSize, NMax);
	this.ds          = new tView(this.b, (row_offset++)*rowSize, NMax);

	this.numRows     = row_offset;
}

BruteFrog.prototype.Leap = function(){
	var i;

	for (i=0; i < this.N; i++) this.positions_x[i] += this.vels_x[i];
	for (i=0; i < this.N; i++) this.positions_x[i] += this.accs_x[i];

	for (i=0; i < this.N; i++) this.positions_y[i] += this.vels_y[i];
	for (i=0; i < this.N; i++) this.positions_y[i] += this.accs_y[i];

	for (i=0; i < this.N; i++) this.positions_z[i] += this.vels_z[i];
	for (i=0; i < this.N; i++) this.positions_z[i] += this.accs_z[i];

	this.batchCalcAcceleration();

	for (i=0; i < this.N; i++){
		this.vels_x[i] += this.accs_x[i];
		this.vels_x[i] += this.accs_old_x[i];
	}
		for (i=0; i < this.N; i++){
		this.vels_y[i] += this.accs_y[i];
		this.vels_y[i] += this.accs_old_y[i];
	}
		for (i=0; i < this.N; i++){
		this.vels_z[i] += this.accs_z[i];
		this.vels_z[i] += this.accs_old_z[i];
	}
}

BruteFrog.prototype.DeadDumbLeapWrapper = function(particles){
	if (particles.length > this.MaxNumParticles){
		console.log("Physics buffer too small, failing...")
		return false;
	}else{
		this.N = particles.length;
		for (i=0; i< this.N; i++){
			this.positions_x[i] = particles[i].position.x;
			this.positions_y[i] = particles[i].position.y;
			this.positions_z[i] = particles[i].position.z;
			this.vels_x[i]      = particles[i].vel.x;
			this.vels_y[i]      = particles[i].vel.y;
			this.vels_z[i]      = particles[i].vel.z;
			this.accs_x[i]      = particles[i].acc.x;
			this.accs_y[i]      = particles[i].acc.y;
			this.accs_z[i]      = particles[i].acc.z;
			this.accs_old_x[i]  = particles[i].acc_old.x;
			this.accs_old_y[i]  = particles[i].acc_old.y;
			this.accs_old_z[i]  = particles[i].acc_old.z;
			this.masses[i]      = particles[i].mass;
			this.dts[i]         = particles[i].dt;
		}
		this.Leap();
		for (i=0; i< this.N; i++){
			particles[i].position.x = this.positions_x[i];
			particles[i].position.y = this.positions_y[i];
			particles[i].position.z = this.positions_z[i];
			particles[i].vel.x      = this.vels_x[i];
			particles[i].vel.y      = this.vels_y[i];
			particles[i].vel.z      = this.vels_z[i];
			particles[i].acc.x      = this.accs_x[i];
			particles[i].acc.y      = this.accs_y[i];
			particles[i].acc.z      = this.accs_z[i];
			particles[i].acc_old.x  = this.accs_old_x[i];
			particles[i].acc_old.y  = this.accs_old_y[i];
			particles[i].acc_old.z  = this.accs_old_z[i];
			particles[i].mass       = this.masses[i];
			particles[i].dt         = this.dts[i]; 
		}
		return true;
	}
}

BruteFrog.prototype.resize = function(NewSize){
	//Copy to either a larger or smaller buffer size.
	var i;
	newFrog = BruteFrog(NewSize);
	newFrog.N = this.N;
	for(j=0; j < this.numRows; j++){
		for(i=0; i < this.N; i++){
			newFrog.allrows[ j*newFrog.N + i] = this.allrows[ j*this.N + i];
		}
	}
	return newFrog;
}


BruteFrog.prototype.MapToParticleArray = function(particles){
	//Particles has to be an array of Particle s.
	//Expose (as views) to particle class through its constructor^^^
	//Something like:
	//particle[i].thing.x = Float64Array(thing_x[i]) etc.


	var i;
	for(i=0; i<particles.length; i++){
		this.addParticle(particles[i]);
	}
}

BruteFrog.prototype.addParticle = function(particle){
	if (this.N+1 < this.MaxNumParticles){
		//add
		//the
		//particle
		this.N++;
	}else return false;
}

BruteFrog.prototype.singleCalcAcceleration = function(index_current){
	//Calculates the accseleration of a single particle (index index_current)
	//Due to all particles (index j)
	var j;

	dt_sq_over_2 = this.dts[index_current]*this.dts[index_current]/2;
	
	var x,y,z;
	x = this.positions_x[index_current];
	y = this.positions_y[index_current];
	z = this.positions_z[index_current];

	//Find relative positions:
	for(j=0; j < this.N; j++) this.delta_rs_x[j] = this.positions_x[j] - x;
	for(j=0; j < this.N; j++) this.delta_rs_y[j] = this.positions_y[j] - y;
	for(j=0; j < this.N; j++) this.delta_rs_z[j] = this.positions_z[j] - z;

	//Find distances squared:
	for(j=0; j < this.N; j++) this.dsquares[j]  = this.delta_rs_x[j] * this.delta_rs_x[j];
	for(j=0; j < this.N; j++) this.dsquares[j] += this.delta_rs_y[j] * this.delta_rs_y[j];
	for(j=0; j < this.N; j++) this.dsquares[j] += this.delta_rs_z[j] * this.delta_rs_z[j];

	//Find magnitudes of every acceleration:
	for(j=0; j < this.N; j++){
		this.tmp_accel_mags[j] = this.masses[j] / this.dsquares[j];
	}
	//Find distances.
	for(j=0; j < this.N; j++) this.ds[j] = Math.sqrt(this.dsquares[j]);
	
	//Replace every relative position vector with its unit vector.
	for(j=0; j < this.N; j++) this.delta_rs_x[j] /= this.ds[j];
	for(j=0; j < this.N; j++) this.delta_rs_y[j] /= this.ds[j];
	for(j=0; j < this.N; j++) this.delta_rs_z[j] /= this.ds[j];

	//Find acceleration vectors
	for(j=0; j < this.N; j++){
		this.tmp_accs_x[j] = this.tmp_accel_mags[j] * this.delta_rs_x[j];
	}
	for(j=0; j < this.N; j++){
		this.tmp_accs_y[j] = this.tmp_accel_mags[j] * this.delta_rs_y[j];
	}
	for(j=0; j < this.N; j++){
		this.tmp_accs_z[j] = this.tmp_accel_mags[j] * this.delta_rs_z[j];
	}

	//Don't include self-acceleration.
	this.tmp_accs_x[index_current] = 0.;
	this.tmp_accs_y[index_current] = 0.;
	this.tmp_accs_z[index_current] = 0.;

	//Sum Accelerations.
	for(j=0; j < this.N; j++) this.accs_x[index_current] += this.tmp_accs_x[j];
	for(j=0; j < this.N; j++) this.accs_y[index_current] += this.tmp_accs_y[j];
	for(j=0; j < this.N; j++) this.accs_z[index_current] += this.tmp_accs_z[j];

	//Set accelerations to simulation units.
	this.accs_x[index_current] *= this.G * dt_sq_over_2;
	this.accs_y[index_current] *= this.G * dt_sq_over_2;
	this.accs_z[index_current] *= this.G * dt_sq_over_2;
}

BruteFrog.prototype.batchCalcAcceleration = function(){
//Calculates the acceleration of every particle.

	this.accs_Swap_x = this.accs_old_x;
	this.accs_Swap_y = this.accs_old_y;
	this.accs_Swap_z = this.accs_old_z;

	this.accs_old_x  = this.accs_x;
	this.accs_old_y  = this.accs_y;
	this.accs_old_z  = this.accs_z;

	this.accs_x      = this.accs_Swap_x;
	this.accs_y      = this.accs_Swap_y;
	this.accs_z      = this.accs_Swap_z;

	this.accs_x.fill(0.);
	this.accs_y.fill(0.);
	this.accs_z.fill(0.);

	for(var i=0; i < this.N; i++) this.singleCalcAcceleration(i);
}

BruteFrog.prototype.FasterSqrts = function(x_sq, x, N){
	//Squares and x are Float32Array views.
	//If they're 64 bit floats, this boat is sunk.
	var one_buf  = new ArrayBuffer( Float32Array.BYTES_PER_ELEMENT);
	var one      = new Float32Array(one);
	var bits_half= new Uint32Array(one);
 
    var bits_x   = new Uint32Array(x.buffer, x.byteOffset, N)
    one[0]  = 1.;
    bits_half[0] /= 2;

    for (i=0; i < N; i++) x[i]       = x_sq[i];
    for (i=0; i < N; i++) bits_x[i] /= 2;
    for (i=0; i < N; i++) bits_x[i] += bits_half[0];

    var refinements = 2;

    if(refinements-- > 0){
    	for(i=0;i < N; i++){
    		x[i] = (x[i] + x_sq[i]/x[i]) / 2.
    	}
	}

    if(refinements-- > 0){
    	for(i=0;i < N; i++){
    		x[i] = (x[i] + x_sq[i]/x[i]) / 2.
    	}
	}
	//Yeah, I did that.

}


// function TypedBufferPool(t, NumElements){
// 	this.elementSize = t.BYTES_PER_ELEMENT;
// 	this.capacityInBytes = NumElements * this.elementSize;
// 	this.b = new ArrayBuffer(this.capacityInBytes);
// 	this.t = t;
// 	this.offsetElements = 0;

// }

// TypedBufferPool.prototype.checkChunk = function(NumElements){
// 	if (NumElements + this.offsetElements) * t.BYTES_PER_ELEMENT > this.capacityInBytes){
// 		return false;//Brute Force did not guess its size correctly.
// 	}else{
// 		return true;
// 	}		
// }


// function Vector3dBuffer = function(pool, N){
// 	this.pool = p;

// 	if (pool.checkChunk(3*N)){
// 	 	var offsetElements = pool.offsetElements;

// 		this.flat   = new pool.tView(pool.b, this.offset, 3*N);
// 		this.x      = new pool.tView(pool.b, 0 + this.offset, N);
// 	}
// 	this.offset = poolChunk(3*N)
// 	this.flat = new tView(this.b, i * rowSize, 3 * N);
// 	this.x    = new tView(this.b, i * rowSize, N_vectors);
// 	this.y    = new tView(this.b, i * rowSize, N_vectors);
// 	this.z    = new tView(this.b, i * rowSize, N_vectors);
// }

