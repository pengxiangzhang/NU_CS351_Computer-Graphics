//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)
//
// Chapter 5: ColoredTriangle.js (c) 2012 matsuda  AND
// Chapter 4: RotatingTriangle_withButtons.js (c) 2012 matsuda
// became:
//
// BasicShapes.js  MODIFIED for EECS 351-1, 
//									Northwestern Univ. Jack Tumblin
//		--converted from 2D to 4D (x,y,z,w) vertices
//		--extend to other attributes: color, surface normal, etc.
//		--demonstrate how to keep & use MULTIPLE colored shapes in just one
//			Vertex Buffer Object(VBO). 
//		--create several canonical 3D shapes borrowed from 'GLUT' library:
//		--Demonstrate how to make a 'stepped spiral' tri-strip,  and use it
//			to build a cylinder, sphere, and torus.
//
// Vertex shader program----------------------------------
var VSHADER_SOURCE =
	'uniform mat4 u_ModelMatrix;\n' +
	'attribute vec4 a_Position;\n' +
	'attribute vec4 a_Color;\n' +
	'varying vec4 v_Color;\n' +
	'void main() {\n' +
	'  gl_Position = u_ModelMatrix * a_Position;\n' +
	'  gl_PointSize = 10.0;\n' +
	'  v_Color = a_Color;\n' +
	'}\n';

// Fragment shader program----------------------------------
var FSHADER_SOURCE =
	//  '#ifdef GL_ES\n' +
	'precision mediump float;\n' +
	//  '#endif GL_ES\n' +
	'varying vec4 v_Color;\n' +
	'void main() {\n' +
	'  gl_FragColor = v_Color;\n' +
	'}\n';

// Global Variables
var ANGLE_STEP = 45.0;		// Rotation angle rate (degrees/second)
var floatsPerVertex = 7;	// # of Float32Array elements used for each vertex
var canvas
// (x,y,z,w)position + (r,g,b)color
// Later, see if you can add:
// (x,y,z) surface normal + (tx,ty) texture addr.
//------------For mouse click-and-drag------------
var g_isDrag = false;
var g_xMclik = 0.0;
var g_yMclik = 0.0;
var g_xDragTo = 0.01845;
var g_yDragTo = -2.4170;
var g_digits = 5;
//------------For keyboard moving------------
var g_xKeyTo = 0.0;
var g_yKeyTo = 0.0;
var g_xKeySpin = 0.0;
var g_yKeySpin = 0.0;
//------------For Animation------------
var g_isRun = true;
var g_lastMS = Date.now();
var g_angle01 = 0;
var g_angle01Rate = 100;
var g_angle02 = 0;
var g_angle02Rate = 1000;
var g_move = 0;
var g_moveRate = 0.01;
//------------Camera------------

var g_EyeX = 5, g_EyeY = -29.5, g_EyeZ = 39.5;
var g_LookAtX = 5, g_LookAtY = -28.5, g_LookatZ = 38.5;
var theta = 90;
var g_DisplaceX = (g_LookAtX - g_EyeX) * 0.5;
var g_DisplaceY = (g_LookAtY - g_EyeY) * 0.5;
var g_DisplaceZ = (g_LookatZ - g_EyeZ) * 0.5;
function main() {
	//==============================================================================
	// Retrieve <canvas> element
	canvas = document.getElementById('webgl');
	canvas.width = window.innerWidth * 0.98;
	canvas.height = window.innerHeight * 0.6;
	window.addEventListener("keydown", myKeyDown, false);
	window.addEventListener("mousedown", myMouseDown);
	window.addEventListener("mousemove", myMouseMove);
	window.addEventListener("mouseup", myMouseUp);
	// Get the rendering context for WebGL
	var gl = getWebGLContext(canvas);
	if (!gl) {
		console.log('Failed to get the rendering context for WebGL');
		return;
	}

	// Initialize shaders
	if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
		console.log('Failed to intialize shaders.');
		return;
	}

	// 
	var n = initVertexBuffer(gl);
	if (n < 0) {
		console.log('Failed to set the vertex information');
		return;
	}

	// Specify the color for clearing <canvas>
	gl.clearColor(0.0, 0.0, 0.0, 1.0);

	// NEW!! Enable 3D depth-test when drawing: don't over-draw at any pixel 
	// unless the new Z value is closer to the eye than the old one..
	//	gl.depthFunc(gl.LESS);			 // WebGL default setting: (default)
	gl.enable(gl.DEPTH_TEST);

	//==============================================================================
	// STEP 4:   REMOVE This "reversed-depth correction"
	//       when you apply any of the 3D camera-lens transforms: 
	//      (e.g. Matrix4 member functions 'perspective(), frustum(), ortho() ...)
	//======================REVERSED-DEPTH Correction===============================
	/*
	  //  b) reverse the usage of the depth-buffer's stored values, like this:
	  gl.enable(gl.DEPTH_TEST); // enabled by default, but let's be SURE.
	  gl.clearDepth(0.0);       // each time we 'clear' our depth buffer, set all
								// pixel depths to 0.0  (1.0 is DEFAULT)
	  gl.depthFunc(gl.GREATER); // draw a pixel only if its depth value is GREATER
								// than the depth buffer's stored value.
								// (gl.LESS is DEFAULT; reverse it!)
	*/
	//=====================================================================

	// Get handle to graphics system's storage location of u_ModelMatrix
	var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
	if (!u_ModelMatrix) {
		console.log('Failed to get the storage location of u_ModelMatrix');
		return;
	}
	// Create a local version of our model matrix in JavaScript 
	var modelMatrix = new Matrix4();

	// Create, init current rotation angle value in JavaScript
	var currentAngle = 0.0;

	//-----------------  
	// Start drawing: create 'tick' variable whose value is this function:
	var tick = function () {
		currentAngle = animate(currentAngle);  // Update the rotation angle
		drawAll(canvas, gl, n, currentAngle, modelMatrix, u_ModelMatrix);   // Draw shapes
		// report current angle on console
		//console.log('currentAngle=',currentAngle);
		requestAnimationFrame(tick, canvas);
		// Request that the browser re-draw the webpage
	};
	tick();							// start (and continue) animation: draw current image

}

function initVertexBuffer(gl) {
	//==============================================================================
	// Create one giant vertex buffer object (VBO) that holds all vertices for all
	// shapes.

	var graphShapes = new Float32Array([
		// ------------A------------
		0.5, 0.0, 0.0, 1.0, 0.970, 0.000, 0.857, // Node 1
		0.5, 0.0, 1.0, 1.0, 0.000, 0.097, 0.970, // Node 2
		0.5, 2.0, 1.0, 1.0, 0.970, 0.097, 0.000, // Node 6
		0.5, 2.0, 1.0, 1.0, 0.970, 0.097, 0.000, // Node 6
		0.5, 2.0, 0.0, 1.0, 0.938, 0.970, 0.000, // Node 5
		0.5, 0.0, 0.0, 1.0, 0.970, 0.000, 0.857, // Node 1


		0.5, 2.0, 1.0, 1.0, 0.970, 0.097, 0.000, // Node 6
		0.0, 2.0, 1.0, 1.0, 0.270, 0.270, 0.267, // Node 7
		0.0, 2.0, 0.0, 1.0, 0.000, 0.970, 0.372, // Node 4
		0.0, 2.0, 0.0, 1.0, 0.000, 0.970, 0.372, // Node 4
		0.5, 2.0, 0.0, 1.0, 0.938, 0.970, 0.000, // Node 5
		0.5, 2.0, 1.0, 1.0, 0.970, 0.097, 0.000, // Node 6


		0.0, 2.0, 1.0, 1.0, 0.270, 0.270, 0.267, // Node 7
		0.0, 2.0, 0.0, 1.0, 0.000, 0.970, 0.372, // Node 4
		0.0, 0.0, 0.0, 1.0, 0.970, 0.000, 0.000, // Node 0
		0.0, 0.0, 0.0, 1.0, 0.970, 0.000, 0.000, // Node 0
		0.0, 0.0, 1.0, 1.0, 0.000, 0.954, 0.970, // Node 3
		0.0, 2.0, 1.0, 1.0, 0.270, 0.270, 0.267, // Node 7


		0.5, 0.0, 1.0, 1.0, 0.000, 0.097, 0.970, // Node 2
		0.5, 0.0, 0.0, 1.0, 0.970, 0.000, 0.857, // Node 1
		0.0, 0.0, 0.0, 1.0, 0.970, 0.000, 0.000, // Node 0
		0.0, 0.0, 0.0, 1.0, 0.970, 0.000, 0.000, // Node 0
		0.0, 0.0, 1.0, 1.0, 0.000, 0.954, 0.970, // Node 3
		0.5, 0.0, 1.0, 1.0, 0.000, 0.097, 0.970, // Node 2


		0.0, 2.0, 1.0, 1.0, 0.270, 0.270, 0.267, // Node 7
		0.0, 0.0, 1.0, 1.0, 0.000, 0.954, 0.970, // Node 3
		0.5, 0.0, 1.0, 1.0, 0.000, 0.097, 0.970, // Node 2
		0.5, 0.0, 1.0, 1.0, 0.000, 0.097, 0.970, // Node 2
		0.5, 2.0, 1.0, 1.0, 0.970, 0.097, 0.000, // Node 6
		0.0, 2.0, 1.0, 1.0, 0.270, 0.270, 0.267, // Node 7


		0.0, 2.0, 0.0, 1.0, 0.000, 0.970, 0.372, // Node 4
		0.5, 2.0, 0.0, 1.0, 0.938, 0.970, 0.000, // Node 5
		0.5, 0.0, 0.0, 1.0, 0.970, 0.000, 0.857, // Node 1
		0.5, 0.0, 0.0, 1.0, 0.970, 0.000, 0.857, // Node 1
		0.0, 0.0, 0.0, 1.0, 0.970, 0.000, 0.000, // Node 0
		0.0, 2.0, 0.0, 1.0, 0.000, 0.970, 0.372, // Node 4

		// ------------B------------
		1.0, 0.0, 0.0, 1.0, 0.970, 0.000, 0.857, // Node 1
		1.0, 0.0, 1.0, 1.0, 0.000, 0.097, 0.970, // Node 2
		1.0, 1.0, 1.0, 1.0, 0.970, 0.097, 0.000, // Node 6
		1.0, 1.0, 1.0, 1.0, 0.970, 0.097, 0.000, // Node 6
		1.0, 1.0, 0.0, 1.0, 0.938, 0.970, 0.000, // Node 5
		1.0, 0.0, 0.0, 1.0, 0.970, 0.000, 0.857, // Node 1

		1.0, 1.0, 1.0, 1.0, 0.970, 0.097, 0.000, // Node 6
		1.0, 0.0, 1.0, 1.0, 0.000, 0.097, 0.970, // Node 2
		2.0, 1.0, 1.0, 1.0, 0.590, 0.425, 0.425,


		1.0, 1.0, 1.0, 1.0, 0.970, 0.097, 0.000, // Node 6
		0.0, 1.0, 1.0, 1.0, 0.270, 0.270, 0.267, // Node 7
		0.0, 1.0, 0.0, 1.0, 0.000, 0.970, 0.372, // Node 4
		0.0, 1.0, 0.0, 1.0, 0.000, 0.970, 0.372, // Node 4
		1.0, 1.0, 0.0, 1.0, 0.938, 0.970, 0.000, // Node 5
		1.0, 1.0, 1.0, 1.0, 0.970, 0.097, 0.000, // Node 6

		0.0, 1.0, 0.0, 1.0, 0.000, 0.970, 0.372, // Node 4
		0.0, 1.0, 1.0, 1.0, 0.270, 0.270, 0.267, // Node 7
		0.0, 2.0, 1.0, 1.0, 0.590, 0.425, 0.425,


		0.0, 1.0, 1.0, 1.0, 0.270, 0.270, 0.267, // Node 7
		0.0, 1.0, 0.0, 1.0, 0.000, 0.970, 0.372, // Node 4
		0.0, 0.0, 0.0, 1.0, 0.970, 0.000, 0.000, // Node 0
		0.0, 0.0, 0.0, 1.0, 0.970, 0.000, 0.000, // Node 0
		0.0, 0.0, 1.0, 1.0, 0.000, 0.954, 0.970, // Node 3
		0.0, 1.0, 1.0, 1.0, 0.270, 0.270, 0.267, // Node 7

		0.0, 0.0, 0.0, 1.0, 0.970, 0.000, 0.000, // Node 0
		0.0, 1.0, 0.0, 1.0, 0.000, 0.970, 0.372, // Node 4
		-1.0, 1.0, 0.0, 1.0, 0.000, 0.970, 0.372,

		1.0, 0.0, 1.0, 1.0, 0.000, 0.097, 0.970, // Node 2
		1.0, 0.0, 0.0, 1.0, 0.970, 0.000, 0.857, // Node 1
		0.0, 0.0, 0.0, 1.0, 0.970, 0.000, 0.000, // Node 0
		0.0, 0.0, 0.0, 1.0, 0.970, 0.000, 0.000, // Node 0
		0.0, 0.0, 1.0, 1.0, 0.000, 0.954, 0.970, // Node 3
		1.0, 0.0, 1.0, 1.0, 0.000, 0.097, 0.970, // Node 2

		0.0, 0.0, 0.0, 1.0, 0.970, 0.000, 0.000, // Node 0
		1.0, 0.0, 0.0, 1.0, 0.970, 0.000, 0.857, // Node 1
		1.0, -1.0, 0.0, 1.0, 0.000, 0.970, 0.372,


		0.0, 1.0, 1.0, 1.0, 0.270, 0.270, 0.267, // Node 7
		0.0, 0.0, 1.0, 1.0, 0.000, 0.954, 0.970, // Node 3
		1.0, 0.0, 1.0, 1.0, 0.000, 0.097, 0.970, // Node 2
		1.0, 0.0, 1.0, 1.0, 0.000, 0.097, 0.970, // Node 2
		1.0, 1.0, 1.0, 1.0, 0.970, 0.097, 0.000, // Node 6
		0.0, 1.0, 1.0, 1.0, 0.270, 0.270, 0.267, // Node 7

		0.0, 1.0, 0.0, 1.0, 0.000, 0.970, 0.372, // Node 4
		1.0, 1.0, 0.0, 1.0, 0.938, 0.970, 0.000, // Node 5
		1.0, 0.0, 0.0, 1.0, 0.970, 0.000, 0.857, // Node 1
		1.0, 0.0, 0.0, 1.0, 0.970, 0.000, 0.857, // Node 1
		0.0, 0.0, 0.0, 1.0, 0.970, 0.000, 0.000, // Node 0
		0.0, 1.0, 0.0, 1.0, 0.000, 0.970, 0.372, // Node 4

		// ------------C------------
		0.5, 0.0, 0.0, 1.0, 0.970, 0.000, 0.857, // Node 1
		0.5, 0.0, 1.0, 1.0, 0.000, 0.097, 0.970, // Node 2
		2.0, 1.0, 1.0, 1.0, 0.970, 0.097, 0.000, // Node 6
		2.0, 1.0, 1.0, 1.0, 0.970, 0.097, 0.000, // Node 6
		2.0, 1.0, 0.0, 1.0, 0.938, 0.970, 0.000, // Node 5
		0.5, 0.0, 0.0, 1.0, 0.970, 0.000, 0.857, // Node 1

		2.0, 1.0, 0.0, 1.0, 0.938, 0.970, 0.000, // Node 5
		2.0, 1.0, 1.0, 1.0, 0.970, 0.097, 0.000, // Node 6
		3.0, 1.0, 1.0, 1.0, 0.970, 0.097, 0.000, // Node
		3.0, 1.0, 1.0, 1.0, 0.970, 0.097, 0.000, // Node 
		3.0, 1.0, 0.0, 1.0, 0.938, 0.970, 0.000, // Node 5
		2.0, 1.0, 0.0, 1.0, 0.938, 0.970, 0.000, // Node 5


		2.0, 1.0, 1.0, 1.0, 0.970, 0.097, 0.000, // Node 6
		1.0, 1.0, 1.0, 1.0, 0.270, 0.270, 0.267, // Node 7
		1.0, 1.0, 0.0, 1.0, 0.000, 0.970, 0.372, // Node 4
		1.0, 1.0, 0.0, 1.0, 0.000, 0.970, 0.372, // Node 4
		2.0, 1.0, 0.0, 1.0, 0.938, 0.970, 0.000, // Node 5
		2.0, 1.0, 1.0, 1.0, 0.970, 0.097, 0.000, // Node 6


		1.0, 1.0, 1.0, 1.0, 0.270, 0.270, 0.267, // Node 7
		1.0, 1.0, 0.0, 1.0, 0.000, 0.970, 0.372, // Node 4
		0.0, 0.0, 0.0, 1.0, 0.970, 0.000, 0.000, // Node 0
		0.0, 0.0, 0.0, 1.0, 0.970, 0.000, 0.000, // Node 0
		0.0, 0.0, 1.0, 1.0, 0.000, 0.954, 0.970, // Node 3
		1.0, 1.0, 1.0, 1.0, 0.270, 0.270, 0.267, // Node 7


		0.5, 0.0, 1.0, 1.0, 0.000, 0.097, 0.970, // Node 2
		0.5, 0.0, 0.0, 1.0, 0.970, 0.000, 0.857, // Node 1
		0.0, 0.0, 0.0, 1.0, 0.970, 0.000, 0.000, // Node 0
		0.0, 0.0, 0.0, 1.0, 0.970, 0.000, 0.000, // Node 0
		0.0, 0.0, 1.0, 1.0, 0.000, 0.954, 0.970, // Node 3
		0.5, 0.0, 1.0, 1.0, 0.000, 0.097, 0.970, // Node 2


		1.0, 1.0, 1.0, 1.0, 0.270, 0.270, 0.267, // Node 7
		0.0, 0.0, 1.0, 1.0, 0.000, 0.954, 0.970, // Node 3
		0.5, 0.0, 1.0, 1.0, 0.000, 0.097, 0.970, // Node 2
		0.5, 0.0, 1.0, 1.0, 0.000, 0.097, 0.970, // Node 2
		2.0, 1.0, 1.0, 1.0, 0.970, 0.097, 0.000, // Node 6
		1.0, 1.0, 1.0, 1.0, 0.270, 0.270, 0.267, // Node 7


		1.0, 1.0, 0.0, 1.0, 0.000, 0.970, 0.372, // Node 4
		2.0, 1.0, 0.0, 1.0, 0.938, 0.970, 0.000, // Node 5
		0.5, 0.0, 0.0, 1.0, 0.970, 0.000, 0.857, // Node 1
		0.5, 0.0, 0.0, 1.0, 0.970, 0.000, 0.857, // Node 1
		0.0, 0.0, 0.0, 1.0, 0.970, 0.000, 0.000, // Node 0
		1.0, 1.0, 0.0, 1.0, 0.000, 0.970, 0.372, // Node 4

	]);
	makeGroundGrid();				// create, fill the gndVerts array
	makeSphere()					// create, fill the sphVerts array
	// how many floats total needed to store all shapes?
	var mySiz = (graphShapes.length + gndVerts.length + sphVerts.length);

	// How many vertices total?
	var nn = mySiz / floatsPerVertex;
	console.log('nn is', nn, 'mySiz is', mySiz, 'floatsPerVertex is', floatsPerVertex);
	// Copy all shapes into one big Float32 array:
	var colorShapes = new Float32Array(mySiz);
	// Copy them:  remember where to start for each shape:
	cylStart = 0;							// we stored the cylinder first.
	for (i = 0, j = 0; j < graphShapes.length; i++, j++) {
		colorShapes[i] = graphShapes[j];
	}
	gndStart = i;
	for (j = 0; j < gndVerts.length; i++, j++) {
		colorShapes[i] = gndVerts[j];
	}
	sphStart = i;
	for (j = 0; j < sphVerts.length; i++, j++) {// don't initialize i -- reuse it!
		colorShapes[i] = sphVerts[j];
	}

	// Create a buffer object on the graphics hardware:
	var shapeBufferHandle = gl.createBuffer();
	if (!shapeBufferHandle) {
		console.log('Failed to create the shape buffer object');
		return false;
	}

	// Bind the the buffer object to target:
	gl.bindBuffer(gl.ARRAY_BUFFER, shapeBufferHandle);
	// Transfer data from Javascript array colorShapes to Graphics system VBO
	// (Use sparingly--may be slow if you transfer large shapes stored in files)
	gl.bufferData(gl.ARRAY_BUFFER, colorShapes, gl.STATIC_DRAW);

	//Get graphics system's handle for our Vertex Shader's position-input variable: 
	var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
	if (a_Position < 0) {
		console.log('Failed to get the storage location of a_Position');
		return -1;
	}

	var FSIZE = colorShapes.BYTES_PER_ELEMENT; // how many bytes per stored value?

	// Use handle to specify how to retrieve **POSITION** data from our VBO:
	gl.vertexAttribPointer(
		a_Position, 	// choose Vertex Shader attribute to fill with data
		4, 						// how many values? 1,2,3 or 4.  (we're using x,y,z,w)
		gl.FLOAT, 		// data type for each value: usually gl.FLOAT
		false, 				// did we supply fixed-point data AND it needs normalizing?
		FSIZE * floatsPerVertex, // Stride -- how many bytes used to store each vertex?
		// (x,y,z,w, r,g,b) * bytes/value
		0);						// Offset -- now many bytes from START of buffer to the
	// value we will actually use?
	gl.enableVertexAttribArray(a_Position);
	// Enable assignment of vertex buffer object's position data

	// Get graphics system's handle for our Vertex Shader's color-input variable;
	var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
	if (a_Color < 0) {
		console.log('Failed to get the storage location of a_Color');
		return -1;
	}
	// Use handle to specify how to retrieve **COLOR** data from our VBO:
	gl.vertexAttribPointer(
		a_Color, 				// choose Vertex Shader attribute to fill with data
		3, 							// how many values? 1,2,3 or 4. (we're using R,G,B)
		gl.FLOAT, 			// data type for each value: usually gl.FLOAT
		false, 					// did we supply fixed-point data AND it needs normalizing?
		FSIZE * 7, 			// Stride -- how many bytes used to store each vertex?
		// (x,y,z,w, r,g,b) * bytes/value
		FSIZE * 4);			// Offset -- how many bytes from START of buffer to the
	// value we will actually use?  Need to skip over x,y,z,w

	gl.enableVertexAttribArray(a_Color);
	// Enable assignment of vertex buffer object's position data

	//--------------------------------DONE!
	// Unbind the buffer object 
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	return nn;
}

function makeSphere() {
	//==============================================================================
	// Make a sphere from one OpenGL TRIANGLE_STRIP primitive.   Make ring-like 
	// equal-lattitude 'slices' of the sphere (bounded by planes of constant z), 
	// and connect them as a 'stepped spiral' design (see makeCylinder) to build the
	// sphere from one triangle strip.
	var slices = 13;		// # of slices of the sphere along the z axis. >=3 req'd
	// (choose odd # or prime# to avoid accidental symmetry)
	var sliceVerts = 27;	// # of vertices around the top edge of the slice
	// (same number of vertices on bottom of slice, too)
	var topColr = new Float32Array([0.7, 0.7, 0.7]);	// North Pole: light gray
	var equColr = new Float32Array([0.3, 0.7, 0.3]);	// Equator:    bright green
	var botColr = new Float32Array([0.9, 0.9, 0.9]);	// South Pole: brightest gray.
	var sliceAngle = Math.PI / slices;	// lattitude angle spanned by one slice.

	// Create a (global) array to hold this sphere's vertices:
	sphVerts = new Float32Array(((slices * 2 * sliceVerts) - 2) * floatsPerVertex);
	// # of vertices * # of elements needed to store them. 
	// each slice requires 2*sliceVerts vertices except 1st and
	// last ones, which require only 2*sliceVerts-1.

	// Create dome-shaped top slice of sphere at z=+1
	// s counts slices; v counts vertices; 
	// j counts array elements (vertices * elements per vertex)
	var cos0 = 0.0;					// sines,cosines of slice's top, bottom edge.
	var sin0 = 0.0;
	var cos1 = 0.0;
	var sin1 = 0.0;
	var j = 0;							// initialize our array index
	var isLast = 0;
	var isFirst = 1;
	for (s = 0; s < slices; s++) {	// for each slice of the sphere,
		// find sines & cosines for top and bottom of this slice
		if (s == 0) {
			isFirst = 1;	// skip 1st vertex of 1st slice.
			cos0 = 1.0; 	// initialize: start at north pole.
			sin0 = 0.0;
		}
		else {					// otherwise, new top edge == old bottom edge
			isFirst = 0;
			cos0 = cos1;
			sin0 = sin1;
		}								// & compute sine,cosine for new bottom edge.
		cos1 = Math.cos((s + 1) * sliceAngle);
		sin1 = Math.sin((s + 1) * sliceAngle);
		// go around the entire slice, generating TRIANGLE_STRIP verts
		// (Note we don't initialize j; grows with each new attrib,vertex, and slice)
		if (s == slices - 1) isLast = 1;	// skip last vertex of last slice.
		for (v = isFirst; v < 2 * sliceVerts - isLast; v++, j += floatsPerVertex) {
			if (v % 2 == 0) {				// put even# vertices at the the slice's top edge
				// (why PI and not 2*PI? because 0 <= v < 2*sliceVerts
				// and thus we can simplify cos(2*PI(v/2*sliceVerts))  
				sphVerts[j] = sin0 * Math.cos(Math.PI * (v) / sliceVerts);
				sphVerts[j + 1] = sin0 * Math.sin(Math.PI * (v) / sliceVerts);
				sphVerts[j + 2] = cos0;
				sphVerts[j + 3] = 1.0;
			}
			else { 	// put odd# vertices around the slice's lower edge;
				// x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
				// 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
				sphVerts[j] = sin1 * Math.cos(Math.PI * (v - 1) / sliceVerts);		// x
				sphVerts[j + 1] = sin1 * Math.sin(Math.PI * (v - 1) / sliceVerts);		// y
				sphVerts[j + 2] = cos1;																				// z
				sphVerts[j + 3] = 1.0;																				// w.		
			}
			if (s == 0) {	// finally, set some interesting colors for vertices:
				sphVerts[j + 4] = topColr[0];
				sphVerts[j + 5] = topColr[1];
				sphVerts[j + 6] = topColr[2];
			}
			else if (s == slices - 1) {
				sphVerts[j + 4] = botColr[0];
				sphVerts[j + 5] = botColr[1];
				sphVerts[j + 6] = botColr[2];
			}
			else {
				sphVerts[j + 4] = Math.random();// equColr[0]; 
				sphVerts[j + 5] = Math.random();// equColr[1]; 
				sphVerts[j + 6] = Math.random();// equColr[2];					
			}
		}
	}
}


function makeGroundGrid() {
	//==============================================================================
	// Create a list of vertices that create a large grid of lines in the x,y plane
	// centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.

	var xcount = 100;			// # of lines to draw in x,y to make the grid.
	var ycount = 100;
	var xymax = 50.0;			// grid size; extends to cover +/-xymax in x and y.
	var xColr = new Float32Array([1.0, 1.0, 0.3]);	// bright yellow
	var yColr = new Float32Array([0.5, 1.0, 0.5]);	// bright green.

	// Create an (global) array to hold this ground-plane's vertices:
	gndVerts = new Float32Array(floatsPerVertex * 2 * (xcount + ycount));
	// draw a grid made of xcount+ycount lines; 2 vertices per line.

	var xgap = xymax / (xcount - 1);		// HALF-spacing between lines in x,y;
	var ygap = xymax / (ycount - 1);		// (why half? because v==(0line number/2))

	// First, step thru x values as we make vertical lines of constant-x:
	for (v = 0, j = 0; v < 2 * xcount; v++, j += floatsPerVertex) {
		if (v % 2 == 0) {	// put even-numbered vertices at (xnow, -xymax, 0)
			gndVerts[j] = -xymax + (v) * xgap;	// x
			gndVerts[j + 1] = -xymax;								// y
			gndVerts[j + 2] = 0.0;									// z
			gndVerts[j + 3] = 1.0;									// w.
		}
		else {				// put odd-numbered vertices at (xnow, +xymax, 0).
			gndVerts[j] = -xymax + (v - 1) * xgap;	// x
			gndVerts[j + 1] = xymax;								// y
			gndVerts[j + 2] = 0.0;									// z
			gndVerts[j + 3] = 1.0;									// w.
		}
		gndVerts[j + 4] = xColr[0];			// red
		gndVerts[j + 5] = xColr[1];			// grn
		gndVerts[j + 6] = xColr[2];			// blu
	}
	// Second, step thru y values as wqe make horizontal lines of constant-y:
	// (don't re-initialize j--we're adding more vertices to the array)
	for (v = 0; v < 2 * ycount; v++, j += floatsPerVertex) {
		if (v % 2 == 0) {		// put even-numbered vertices at (-xymax, ynow, 0)
			gndVerts[j] = -xymax;								// x
			gndVerts[j + 1] = -xymax + (v) * ygap;	// y
			gndVerts[j + 2] = 0.0;									// z
			gndVerts[j + 3] = 1.0;									// w.
		}
		else {					// put odd-numbered vertices at (+xymax, ynow, 0).
			gndVerts[j] = xymax;								// x
			gndVerts[j + 1] = -xymax + (v - 1) * ygap;	// y
			gndVerts[j + 2] = 0.0;									// z
			gndVerts[j + 3] = 1.0;									// w.
		}
		gndVerts[j + 4] = yColr[0];			// red
		gndVerts[j + 5] = yColr[1];			// grn
		gndVerts[j + 6] = yColr[2];			// blu
	}
}

function DrawTap(gl, modelMatrix, u_ModelMatrix) {
	modelMatrix.scale(1.0, 1.0, 1.0);
	modelMatrix.scale(3.0, 3.0, 3.0);
	modelMatrix.translate(-1.5, 0.0, 0.0);

	modelMatrix.rotate(90.0, 2.0, 0.0, 0.0);
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 0.0, 36.0);

	modelMatrix.translate(0.5, 2.0, 0.0);
	modelMatrix.scale(0.6, 0.6, 1.0);
	modelMatrix.rotate(-90.0, 0.0, 0.0)
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 0.0, 36.0);
	modelMatrix.rotate(90.0, 0.0, 0.0)
	pushMatrix(modelMatrix);

}

function DrawOutlet(gl, modelMatrix, u_ModelMatrix, x, y, z) {
	modelMatrix = popMatrix();
	pushMatrix(modelMatrix);
	modelMatrix.translate(x, y, z);
	modelMatrix.scale(0.2, 0.2, 0.2);
	modelMatrix.rotate(g_angle01, 0.0, 0.0, 1.0);
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 36.0, 48.0);
	modelMatrix.translate(2.0, 1.0, 1.0);
	modelMatrix.rotate(g_angle02, 0.0, 0.0, 1.0);
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 36.0, 48.0);
}

function DrawWater(gl, modelMatrix, u_ModelMatrix, x, y, z) {
	modelMatrix = popMatrix();
	pushMatrix(modelMatrix);
	modelMatrix.translate(x, y, z);
	modelMatrix.scale(0.2, 0.2, 0.2);
	modelMatrix.rotate(g_angle01, 0.0, 0.0, 1.0);
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 36.0, 48.0);
}

function DrawControl(gl, modelMatrix, u_ModelMatrix, x, y, z, control) {
	modelMatrix = popMatrix();
	pushMatrix(modelMatrix);
	modelMatrix.translate(x, y, z);
	modelMatrix.scale(1, 1, 1);
	modelMatrix.scale(1, 1, 1);
	modelMatrix.rotate(control, 0, 0, 1);
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 84, 42);

}

function DrawSph(gl, modelMatrix, u_ModelMatrix) {
	modelMatrix = popMatrix();
	pushMatrix(modelMatrix);
	modelMatrix.translate(2, 0, -4);
	modelMatrix.scale(1, 1, 1);
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
		sphStart / floatsPerVertex,	// start at this vertex number, and 
		sphVerts.length / floatsPerVertex);	// draw this many vertices.
}

function DrawGrid(gl, modelMatrix, u_ModelMatrix) {
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	gl.drawArrays(gl.LINES, gndStart / floatsPerVertex, gndVerts.length / floatsPerVertex);
}

function drawAll(canvas, gl, n, currentAngle, modelMatrix, u_ModelMatrix) {
	//==============================================================================
	// Clear <canvas>  colors AND the depth buffer
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	//===========================================================
	modelMatrix.setIdentity();
	gl.viewport(0, 0, canvas.width / 2, canvas.height);
	modelMatrix.perspective(35, 1.0, 1.0, 500.0);
	modelMatrix.lookAt(g_EyeX, g_EyeY, g_EyeZ,	// center of projection
		g_LookAtX, g_LookAtY, g_LookatZ,	// look-at point 
		0, 0, 1);	// View UP vector.

	DrawGrid(gl, modelMatrix, u_ModelMatrix);
	DrawTap(gl, modelMatrix, u_ModelMatrix)
	DrawOutlet(gl, modelMatrix, u_ModelMatrix, 0.5, 1.5, 0.5)
	DrawOutlet(gl, modelMatrix, u_ModelMatrix, 0.5, 2, 0.5)
	DrawWater(gl, modelMatrix, u_ModelMatrix, 1 + g_move, 1.8, 0.5)
	DrawWater(gl, modelMatrix, u_ModelMatrix, 1.5 + g_move, 1.8, 0.5)
	DrawWater(gl, modelMatrix, u_ModelMatrix, 2 + g_move, 1.8, 0.5)
	DrawControl(gl, modelMatrix, u_ModelMatrix, 7, 0, 0, g_xKeySpin)
	DrawControl(gl, modelMatrix, u_ModelMatrix, 4, 0, 0, g_yKeySpin)
	DrawSph(gl, modelMatrix, u_ModelMatrix)

	//===========================================================
	modelMatrix.setIdentity();    // DEFINE 'world-space' coords.
	gl.viewport(canvas.width / 2, 0, canvas.width / 2, canvas.height);
	modelMatrix.setOrtho(-10, 10, -10, 10, 0, 99.0);
	modelMatrix.lookAt(g_EyeX, g_EyeY, g_EyeZ,	// center of projection
		g_LookAtX, g_LookAtY, g_LookatZ,	// wlook-at point 
		0, 0, 1);

	pushMatrix(modelMatrix);
	DrawGrid(gl, modelMatrix, u_ModelMatrix);
	DrawTap(gl, modelMatrix, u_ModelMatrix)
	DrawOutlet(gl, modelMatrix, u_ModelMatrix, 0.5, 1.5, 0.5)
	DrawOutlet(gl, modelMatrix, u_ModelMatrix, 0.5, 2, 0.5)
	DrawWater(gl, modelMatrix, u_ModelMatrix, 1 + g_move, 1.8, 0.5)
	DrawWater(gl, modelMatrix, u_ModelMatrix, 1.5 + g_move, 1.8, 0.5)
	DrawWater(gl, modelMatrix, u_ModelMatrix, 2 + g_move, 1.8, 0.5)
	DrawControl(gl, modelMatrix, u_ModelMatrix, 7, 0, 0, g_xKeySpin)
	DrawControl(gl, modelMatrix, u_ModelMatrix, 4, 0, 0, g_yKeySpin)
	DrawSph(gl, modelMatrix, u_ModelMatrix)
}


var g_last = Date.now();
var up = 0
function animate() {
	var now = Date.now();
	var elapsed = now - g_last;

	g_last = now;

	g_angle01 = g_angle01 + (g_angle01Rate * elapsed) / 1000.0;
	if (g_angle01 > 180.0) g_angle01 = g_angle01 - 360.0;
	if (g_angle01 < -180.0) g_angle01 = g_angle01 + 360.0;

	g_angle02 = g_angle02 + (g_angle02Rate * elapsed) / 1000.0;
	if (g_angle02 > 180.0) g_angle02 = g_angle02 - 360.0;
	if (g_angle02 < -180.0) g_angle02 = g_angle02 + 360.0;

	if (up == 0) {
		if (g_move < 0) up = 1
		if (g_move > 5) up = 0
		g_move -= g_moveRate;
	} else {
		if (g_move < 0) up = 1
		if (g_move > 5) up = 0
		g_move += g_moveRate;
	}
}

//==================HTML Button Callbacks
function myKeyDown(kev) {
	g_DisplaceX = (g_LookAtX - g_EyeX) * 0.5;
	g_DisplaceY = (g_LookAtY - g_EyeY) * 0.5;
	g_DisplaceZ = (g_LookatZ - g_EyeZ) * 0.5;

	rotatedX = (g_DisplaceX * Math.cos(90 * (Math.PI / 180))) - (g_DisplaceY * Math.sin(90 * (Math.PI / 180)));
	rotatedY = (g_DisplaceX * Math.sin(90 * (Math.PI / 180))) + (g_DisplaceY * Math.cos(90 * (Math.PI / 180)));
	switch (kev.code) {
		case "KeyJ":
			if (g_moveRate > 0) {
				g_moveRate -= 0.01;
				g_yKeySpin += 5;
			}
			else {
				g_moveRate = 0;
				alert("Already Stopped")
			}
			break;
		case "KeyL":
			g_moveRate += 0.01;
			g_yKeySpin -= 5;
			break;
		case "KeyK":
			g_angle01Rate -= 50;
			g_xKeySpin -= 1;
			break;
		case "KeyI":
			g_angle01Rate += 50;
			g_xKeySpin += 1;
			break;
		case "ArrowRight":
			g_EyeX -= rotatedX;
			g_EyeY -= rotatedY;
			g_LookAtX -= rotatedX;
			g_LookAtY -= rotatedY;
			break;
		case "ArrowLeft":
			g_EyeX += rotatedX;		// INCREASED for perspective camera)
			g_EyeY += rotatedY;

			g_LookAtX += rotatedX;
			g_LookAtY += rotatedY;
			break;
		case "ArrowUp":
			g_EyeX += g_DisplaceX;
			g_EyeY += g_DisplaceY;
			g_EyeZ += g_DisplaceZ;

			g_LookAtX += g_DisplaceX;
			g_LookAtY += g_DisplaceY;
			g_LookatZ += g_DisplaceZ;
			break;
		case "ArrowDown":
			g_EyeX -= g_DisplaceX;
			g_EyeY -= g_DisplaceY;
			g_EyeZ -= g_DisplaceZ;

			g_LookAtX -= g_DisplaceX;
			g_LookAtY -= g_DisplaceY;
			g_LookatZ -= g_DisplaceZ;
			console.log(g_EyeX, g_EyeY, g_EyeZ)
			console.log(g_LookAtX, g_LookAtY, g_LookatZ)
			break;
		case "KeyW":
			g_LookatZ += 0.04;
			break;
		case "KeyS":
			g_LookatZ -= 0.04;
			break;
		case "KeyA":
			theta += 1;
			g_LookAtX = g_EyeX + Math.cos(theta * (Math.PI / 180));
			g_LookAtY = g_EyeY + Math.sin(theta * (Math.PI / 180));
			break;
		case "KeyD":
			theta -= 1;
			g_LookAtX = g_EyeX + Math.cos(theta * (Math.PI / 180));
			g_LookAtY = g_EyeY + Math.sin(theta * (Math.PI / 180));
			break;
	}
}

function myMouseDown() {
	g_isDrag = true;
};

function myMouseMove(ev) {
	if (g_isDrag == false) return;
	var rect = ev.target.getBoundingClientRect();
	var xp = ev.clientX - rect.left;
	var yp = canvas.height - (ev.clientY - rect.top);
	var x = (xp - canvas.width / 2) / (canvas.width / 2);
	var y = (yp - canvas.height / 2) / (canvas.height / 2);
	g_xDragTo += (x - g_xDragTo);
	g_yDragTo += (y - g_yDragTo);
	g_xDragTo = x;
	g_yDragTo = y;
};

function myMouseUp() {
	g_isDrag = false;
};
