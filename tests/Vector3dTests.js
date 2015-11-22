Math.relativeTol = 1E-5;
Math.absoluteTol = 1E-8;

Math.isClose = function(a, b){
	//Based on Numpy implementation: 
	//http://docs.scipy.org/doc/numpy-dev/reference/generated/numpy.isclose.html
	return (Math.abs(a-b) <= Math.absoluteTol + Math.relativeTol * Math.abs(b)); 
};

Vector3d.prototype.isClose = function(v){
	return (Math.isClose(this.x, v.x) && Math.isClose(this.y, v.y) && Math.isClose(this.z, v.z));
};


Vector3d.prototype.tests = function(numSamples){
/*	The usage of every test<Property> is that you expect that property to be "numerically true."
	Failing the test logs to the console. Any output (other than all passed) should be considered a failure.
*/	

	function testLength(vector, expectedLength){
		if(Math.isClose(vector.magnitude(), expectedLength)){
			return true;
		}else{
			console.log("Expected length "+ expectedLength + " for vector " + vector.toString());
			return false;
		}
	}

	function testEquality(vector, expectedVector){
		if (vector.isClose(expectedVector)){
			return true;
		}else if (testLength(vector, expectedVector.magnitude())){
			console.log("Correct length, but wrong direction.");
		}else{
			console.log("Expected vector: " + expectedVector.toString());
			console.log("Found vector: " + vector.toString());
		}
		return false;
	}

	function testPerpendicular(v1, v2){
		var v1Dotv2 = v1.dot(v2);
		var v1Squared = v1.sumSquares();
		var v2Squared = v2.sumSquares();

		v1Dotv2 *= v1Dotv2;
		if(Math.isClose(v1Squared*v2Squared - v1Dotv2, v1Squared*v2Squared)){
			return true;
		}else{
			console.log("Failed perpendicularity: " + v1.toString() + ", " + v2.toString());
			return false;
		}
	}

	function testParallel(v1, v2){
		if (testCoAxial(v1,v2)){
			if (v1.dot(v2) > 0){
				return true;
			}else{
				console.log("Vectors were anti-parallel.  (Did you want testCoAxial?)");
				return false;
			}			
		}else{
			return false;
		}
	}

	function testCoAxial(v1, v2){
		var cosOpeningAngle = v1.dot(v2) / (v1.magnitude() * v2.magnitude());
		var v1Dotv2 = v1.dot(v2);
		v1Dotv2 *= v1Dotv2;

		if(Math.isClose(v1Dotv2, v1.sumSquares()*v2.sumSquares())){
			return true;
		}else{
			console.log("Failed to be parallel or anti-parallel: " + v1.toString() + ", " + v2.toString());
			console.log("Opening angle: " + Math.acos(cosOpeningAngle));
			return false;
		}
	}

	function testDot(v1, v2){
		if (Math.isClose(v1.dot(v2), v2.dot(v1))){
			return true;
		}else{
			console.log("Dot product failed commutivitiy.");
			return false;
		}			
	}

	function testCross(v1, v2){
		var v3 = v1.cross(v2);
		if (!testEquality(v3, v2.cross(v1).scaleMe(-1))){
			console.log("Cross product failed anti-commutivity.");
			return false;
		}
		if (!(testPerpendicular(v3, v1) && testPerpendicular(v3, v2))){
			console.log("Cross product failed perpendicularity.");
			return false;
		}
		return true;
	}

	function testAxes(xAxis, yAxis, zAxis){
	//Test known relationships with specific vectors.
		var passed = true;
		axes = [xAxis, yAxis, zAxis];

		for(i=0; i < axes.length; i++){
			passed &= testLength(axes[i], 1);
			passed &= testParallel(axes[i], axes[i]);
			passed &= testEquality(axes[i].cross(axes[(i+1)%3]), axes[(i+2)%3]);
			for(j=0; j < i; j++){
				passed &= testPerpendicular(axes[i], axes[j]);
			}
		}

		xAxis.original = xAxis.copy();
		passed &= testEquality(xAxis.rotateMe({axis: zAxis, angle: Math.PI/2}), yAxis);
		passed &= testEquality(xAxis.rotateMe({axis: xAxis.original, angle:Math.PI/2}), zAxis);
		passed &= testEquality(xAxis.rotateMe({axis: yAxis, angle:Math.PI/2}), xAxis.original);	
		return passed;
	}

	function testTripleVector(v1, v2, v3){
		var passed = true;
		var tripleVector;
		tripleVector = v1.cross(v2.cross(v3));
		tripleVector.incrementMe(v2.cross(v3.cross(v1)));
		tripleVector.incrementMe(v3.cross(v1.cross(v2)));
		passed &= testEquality(tripleVector, new Vector3d(0,0,0));
		if (!passed){
			console.log("Triple Vector Product Failed for vectors:");
			console.log("v1 : " + v1.toString());
			console.log("v2 : " + v2.toString());
			console.log("v3 : " + v3.toString());
		}
		return passed;
	}

	function testTripleScalar(v1, v2, v3){
		var passed = true;

		var tripleScalar = v1.dot(v2.cross(v3));
		passed &= Math.isClose(tripleScalar, v2.dot(v3.cross(v1)));
		passed &= Math.isClose(tripleScalar, v3.dot(v1.cross(v2)));
		if (!passed){
			console.log("Triple Scalar Product Failed for vectors:");
			console.log("v1 : " + v1.toString());
			console.log("v2 : " + v2.toString());
			console.log("v3 : " + v3.toString());
		}
		return passed;
	}


	var i, j;
	var u, v;
	var passed = true;
	if(numSamples < 2) numSamples = 3;

	var xAxis = new Vector3d(1, 0, 0);
	var yAxis = new Vector3d(0, 1, 0);
	var zAxis = new Vector3d(0, 0, 1);

	specialVectors = [];
	
	if (testAxes(xAxis, yAxis, zAxis)){
		specialVectors.push(xAxis);
		specialVectors.push(yAxis);
		specialVectors.push(zAxis);
	}else{
		passed = false;
	}

	var vZero = new Vector3d(0, 0, 0);
	vZero.expectedLength = 0;

	var unitVectors = [];
	var vectors = [];

	while(specialVectors.length){
		v = specialVectors.pop();
		v.expectedLength = v.magnitude();
		vectors.push(v);
		unitVectors.push(v);
	}

	vectors.push(vZero);

	for(i=0; i < numSamples; i++){
		unitVectors.push(Vector3d.prototype.unitRandom());
		vectors.push(Vector3d.prototype.unitRandom());
	}

	for(i=0; i < vectors.length; i++){
		if(vectors[i].expectedLength === undefined){
			var x = Math.random();// 0 <= x < 1
			x = x / (1-x);// 0 <= x < Infinity
			vectors[i].scaleMe(x);
			vectors[i].expectedLength = x;
		}
		vectors[i].original = vectors[i].copy();
	}

	for(i=0; i < unitVectors.length; i++){
		unitVectors[i].expectedLength = 1;
		unitVectors[i].original = unitVectors[i].copy();
	}

	for(i=0; i < unitVectors.length; i++){
		passed &= testLength(unitVectors[i], 1);
	}

	for (i=0; i < vectors.length; i++){
		passed &= testLength(vectors[i], vectors[i].expectedLength);
		passed &= testEquality(vectors[i].cross(vectors[i]), new Vector3d(0,0,0));
	}

	for (i=0; i < vectors.length; i++){
		for (j = 0; j < i; j++){
			var diff = vectors[i].copy().decrementMe(vectors[j]);
			var sum  = vectors[i].copy().incrementMe(vectors[j]);
			if (!testEquality(diff, vectors[j].copy().decrementMe(vectors[i]).scaleMe(-1))){
				console.log("Vector subtraction failed anti-commutivity.");
				passed = false;
			}
			if (!testEquality(sum,  vectors[j].copy().incrementMe(vectors[i]))){
				console.log("Vector sum failed commutivity.");
				passed = false;
			}
			passed &= testCross(vectors[i], vectors[j]);
			passed &= testDot(vectors[i], vectors[j]);
		}
	}	

	//Triple Product identities.
	//If these fail, but the above pass, likely indicates API problems, not math problem.
	for (i=0; i < vectors.length; i++){
		j = Math.floor(vectors.length * Math.random());
		k = Math.floor(vectors.length * Math.random());
		passed &= testTripleScalar(vectors[i], vectors[j], vectors[k]);
		passed &= testTripleVector(vectors[i], vectors[j], vectors[k]);
	}

	//Vector projections.
	for (i=0; i < vectors.length; i++){
		v = vectors[i];
		for(j=0; j < unitVectors.length; j++){
			u = unitVectors[j];
			var vPlane = v.projectOntoPlane(u);
			var vAxial = v.projectOntoAxis(u);
			var vExpected = vPlane.copy().incrementMe(vAxial);
			passed &= testEquality(v, vExpected);
			if ( ! testPerpendicular(vPlane, u)){
				console.log("Projection onto plane failed to be perpendicular to the normal of that plane.");
				passed = false;
			}
			if ( ! testCoAxial(vAxial, u) ){
				console.log("Projection of a vector onto an axis failed to produce a vector along that axis.");
				passed = false;
			}
		}
	}

	//Try some rotations:
	for(i=0; i < vectors.length; i++){
		v = vectors[i];
		for(j=0; j < unitVectors.length; j++){
			u = unitVectors[j];
			v.rotateMe({axis:u, angle:0});
			if(!testEquality(v, v.original)){
				console.log("Rotation by zero failed to recover original vector.");
				console.log("Original: "  + v.original.toString());
				console.log("Recovered: " + v.toString());
				passed = false;
			}

			var rotationAngle = 2 * Math.PI * Math.random();
			v.rotateMe({axis:u, angle:rotationAngle});

			if (! Math.isClose(v.dot(u), v.original.dot(u))){
				console.log("Rotation failed to preserve opening angle between " + u.toString() + " and " + v.toString());
				passed = false;
			}

			v.rotateMe({axis:u, angle:-rotationAngle});
			if(!testEquality(v, v.original)){
				console.log("Rotation followed by inverse rotation failed to recover original vector.");
				console.log("Original: " + v.original.toString());
				console.log("Recovered: " + v.toString());
				passed = false;
			}

			rotationAngle = 2 * Math.PI * Math.random();
			v.rotateMe({pivotPoint: v.copy(), axis: u, angle:rotationAngle});
			if(!testEquality(v, v.original)){
				console.log("Rotation of a point around a pivot of itself moved the vector.");
				passed = false;
			}	
		}
	}

	//Test angular relations:
	for (i=0; i < numSamples; i ++){
		var theta = Math.PI * Math.random();
		var phi   = Math.TAU * Math.random()-Math.PI;

		u = Vector3d.prototype.unitFromAngles(theta, phi);
		if (!Math.isClose(Math.cos(u.theta()), Math.cos(theta))){
			console.log("Theta (" + theta + ") not recovered from unitFromAngles, got " + u.theta() + " instead.");
			passed = false;
		}else if (!Math.isClose(u.phi()*Math.sin(theta), phi*Math.sin(theta))){
			console.log("Phi (" + phi + ")not recovered from unitFromAngles, got " + u.phi() + " instead.");
			console.log("(Theta was " + theta + ".)");
			passed = false;
		}
	}

	//Test coordinate transforms:
	for(i=0; i < vectors.length; i++){
		if(! vectors[i].isClose(vectors[i].original)){
			console.log("Unexpected mutation of v.");
			console.log("v originally was: " + v.original.toString());
			console.log("found as: " + v.toString());
			passed = false;
		}
		var sphericalV = vectors[i].asRThetaPhi();
		var vNew = Vector3d.prototype.fromRThetaPhi(sphericalV.r, sphericalV.theta, sphericalV.phi);
		if(! vNew.isClose(vectors[i])){
			console.log("Vector --> Spherical --> Vector failed.");
			console.log("Original: " + vectors[i].toString());
			console.log("Spherical: r:" + sphericalV.r + ", theta: "+sphericalV.theta + ", phi: " + sphericalV.phi);
			console.log("New: " + vNew.toString());
			passed = false;
		}
	}
	return passed;
};

Vector3d.prototype.openingAngle = Vector3d.prototype.openingAngle_LawCosines;

numSamples = 10;
//numSamples = 10000; This causes the page to become unresponsive, profiling hangs in chrome every time.
if (Vector3d.prototype.tests(numSamples)){ 
	console.log("All Vector3d tests passed with sample size "+ numSamples +".");
}else{
	console.log("Some Vector3d tests failed.");
}

