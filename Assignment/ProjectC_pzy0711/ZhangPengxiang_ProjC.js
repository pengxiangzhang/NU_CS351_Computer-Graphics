//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)
//
// TABS set to 2.
//
// ORIGINAL SOURCE:
// RotatingTranslatedTriangle.js (c) 2012 matsuda
// HIGHLY MODIFIED to make:
//
// JT_MultiShader.js  for EECS 351-1, 
//									Northwestern Univ. Jack Tumblin

/* Show how to use 3 separate VBOs with different verts, attributes & uniforms. 
-------------------------------------------------------------------------------
  Create a 'VBObox' object/class/prototype & library to collect, hold & use all 
  data and functions we need to render a set of vertices kept in one Vertex 
  Buffer Object (VBO) on-screen, including:
  --All source code for all Vertex Shader(s) and Fragment shader(s) we may use 
    to render the vertices stored in this VBO;
  --all variables needed to select and access this object's VBO, shaders, 
    uniforms, attributes, samplers, texture buffers, and any misc. items. 
  --all variables that hold values (uniforms, vertex arrays, element arrays) we 
    will transfer to the GPU to enable it to render the vertices in our VBO.
  --all user functions: init(), draw(), adjust(), reload(), empty(), restore().
  Put all of it into 'JT_VBObox-Lib.js', a separate library file.

USAGE:
------
1) If your program needs another shader program, make another VBObox object:
 (e.g. an easy vertex & fragment shader program for drawing a ground-plane grid; 
 a fancier shader program for drawing Gouraud-shaded, Phong-lit surfaces, 
 another shader program for drawing Phong-shaded, Phong-lit surfaces, and
 a shader program for multi-textured bump-mapped Phong-shaded & lit surfaces...)
 
 HOW:
 a) COPY CODE: create a new VBObox object by renaming a copy of an existing 
 VBObox object already given to you in the VBObox-Lib.js file. 
 (e.g. copy VBObox1 code to make a VBObox3 object).

 b) CREATE YOUR NEW, GLOBAL VBObox object.  
 For simplicity, make it a global variable. As you only have ONE of these 
 objects, its global scope is unlikely to cause confusions/errors, and you can
 avoid its too-frequent use as a function argument.
 (e.g. above main(), write:    var phongBox = new VBObox3();  )

 c) INITIALIZE: in your JS progam's main() function, initialize your new VBObox;
 (e.g. inside main(), write:  phongBox.init(); )

 d) DRAW: in the JS function that performs all your webGL-drawing tasks, draw
 your new VBObox's contents on-screen. 
 (NOTE: as it's a COPY of an earlier VBObox, your new VBObox's on-screen results
  should duplicate the initial drawing made by the VBObox you copied.  
  If that earlier drawing begins with the exact same initial position and makes 
  the exact same animated moves, then it will hide your new VBObox's drawings!
  --THUS-- be sure to comment out the earlier VBObox's draw() function call  
  to see the draw() result of your new VBObox on-screen).
  (e.g. inside drawAll(), add this:  
      phongBox.switchToMe();
      phongBox.draw();            )

 e) ADJUST: Inside the JS function that animates your webGL drawing by adjusting
 uniforms (updates to ModelMatrix, etc) call the 'adjust' function for each of your
VBOboxes.  Move all the uniform-adjusting operations from that JS function into the
'adjust()' functions for each VBObox. 

2) Customize the VBObox contents; add vertices, add attributes, add uniforms.
 ==============================================================================*/


// Global Variables  
//   (These are almost always a BAD IDEA, but here they eliminate lots of
//    tedious function arguments. 
//    Later, collect them into just a few global, well-organized objects!)
// ============================================================================
// for WebGL usage:--------------------
var gl; // WebGL rendering context -- the 'webGL' object
// in JavaScript with all its member fcns & data
var g_canvasID; // HTML-5 'canvas' element ID#

// For multiple VBOs & Shaders:-----------------
worldBox = new VBObox0(); // Holds VBO & shaders for 3D 'world' ground-plane grid, etc;
GouraudBox = new VBObox1(); // "  "  for first set of custom-shaded 3D parts
PhongBox = new VBObox2(); // "  "  for second set of custom-shaded 3D parts

// For animation:---------------------
var dateNow = Date.now(); // Timestamp (in milliseconds) for our 
// most-recently-drawn WebGL screen contents.  
// Set & used by moveAll() fcn to update all
// time-varying params for our webGL drawings.
// All time-dependent params (you can add more!)
var g_angleNow0 = 0.0; // Current rotation angle, in degrees.
var g_angleRate0 = 45.0; // Rotation angle rate, in degrees/second.
//---------------
var g_angleNow1 = 100.0; // current angle, in degrees
var g_angleRate1 = 95.0; // rotation angle rate, degrees/sec
var g_angleMax1 = 150.0; // max, min allowed angle, in degrees
var g_angleMin1 = 60.0;
//---------------
var g_angleNow2 = 0.0; // Current rotation angle, in degrees.
var g_angleRate2 = -62.0; // Rotation angle rate, in degrees/second.

//---------------
var g_posNow0 = 0.0; // current position
var g_posRate0 = 0.6; // position change rate, in distance/second.
var g_posMax0 = 0.5; // max, min allowed for g_posNow;
var g_posMin0 = -0.5;
// ------------------
var g_posNow1 = 0.0; // current position
var g_posRate1 = 0.5; // position change rate, in distance/second.
var g_posMax1 = 1.0; // max, min allowed positions
var g_posMin1 = -1.0;
//---------------
var g_angle = 0.0; // initial rotation angle
var g_angleRate = 45.0; // rotation speed, in degrees/second 

// For mouse/keyboard:------------------------
var g_show0 = 1; // 0==Show, 1==Hide VBO0 contents on-screen.
var g_show1 = 1; // 	"					"			VBO1		"				"				" 
var g_show2 = 0; //  "         "     VBO2    "       "       "

var g_myMaterial;
var g_showBlinn = false;
var g_shiny;
var g_shinyUser;

var g_lightXUser = document.getElementById('posX').value;
var g_lightYUser = document.getElementById('posY').value;
var g_lightZUser = document.getElementById('posZ').value;
var g_lightXPos;
var g_lightYPos;
var g_lightZPos;


var g_lightAmbiRUser = document.getElementById('ambiR').value;
var g_lightAmbiGUser = document.getElementById('ambiG').value;
var g_lightAmbiBUser = document.getElementById('ambiB').value;
var g_lightRDiff;
var g_lightGDiff;
var g_lightBDiff;

var g_lightDiffRUser = document.getElementById('diffR').value;
var g_lightDiffGUser = document.getElementById('diffG').value;
var g_lightDiffBUser = document.getElementById('diffB').value;
var g_lightRAmbi;
var g_lightGAmbi;
var g_lightBAmbi;

var g_lightSpecRUser = document.getElementById('specR').value;
var g_lightSpecGUser = document.getElementById('specG').value;
var g_lightSpecBUser = document.getElementById('specB').value;
var g_lightRSpec;
var g_lightGSpec;
var g_lightBSpec;

var g_lightXPos_old;
var g_lightYPos_old;
var g_lightZPos_old;
var g_lightRAmbi_old;
var g_lightGAmbi_old;
var g_lightBAmbi_old;
var g_lightRDiff_old;
var g_lightGDiff_old;
var g_lightBDiff_old;
var g_lightRSpec_old;
var g_lightGSpec_old;
var g_lightBSpec_old;

// GLOBAL CAMERA CONTROL:					// 
g_worldMat = new Matrix4(); // Changes CVV drawing axes to 'world' axes.
// (equivalently: transforms 'world' coord. numbers (x,y,z,w) to CVV coord. numbers)
// WHY?
// Lets mouse/keyboard functions set just one global matrix for 'view' and 
// 'projection' transforms; then VBObox objects use it in their 'adjust()'
// member functions to ensure every VBObox draws its 3D parts and assemblies
// using the same 3D camera at the same 3D position in the same 3D world).
var g_isDrag = false;
var g_xMclik = 0.0;
var g_yMclik = 0.0;
var g_xMdragTot = 0.0;
var g_yMdragTot = 0.0;
var qNew = new Quaternion(0, 0, 0, 1); // most-recent mouse drag's rotation
var qTot = new Quaternion(0, 0, 0, 1); // 'current' orientation (made from qNew)
//------------For keyboard moving------------
var g_xKeySpin = 0.0;
var g_yKeySpin = 0.0;
//------------Camera------------
var g_EyeX = 0.55,
    g_EyeY = -9.95,
    g_EyeZ = 9.14;
var g_LookAtX = 0.55,
    g_LookAtY = -8.95,
    g_LookatZ = 8.54;
var theta = 90;
var g_DisplaceX = (g_LookAtX - g_EyeX) * 0.5;
var g_DisplaceY = (g_LookAtY - g_EyeY) * 0.5;
var g_DisplaceZ = (g_LookatZ - g_EyeZ) * 0.5;

// ! Global camera control
g_worldMat = new Matrix4();

function main() {
    //=============================================================================
    // Retrieve the HTML-5 <canvas> element where webGL will draw our pictures:
    window.addEventListener("keydown", myKeyDown, false);
    window.addEventListener("mousedown", myMouseDown);
    window.addEventListener("mousemove", myMouseMove);
    window.addEventListener("mouseup", myMouseUp);
    g_canvasID = document.getElementById('webgl');
    // Create the the WebGL rendering context: one giant JavaScript object that
    // contains the WebGL state machine adjusted by large sets of WebGL functions,
    // built-in variables & parameters, and member data. Every WebGL function call
    // will follow this format:  gl.WebGLfunctionName(args);

    // Create the the WebGL rendering context: one giant JavaScript object that
    // contains the WebGL state machine, adjusted by big sets of WebGL functions,
    // built-in variables & parameters, and member data. Every WebGL func. call
    // will follow this format:  gl.WebGLfunctionName(args);
    //SIMPLE VERSION:  gl = getWebGLContext(g_canvasID); 
    // Here's a BETTER version:
    gl = g_canvasID.getContext("webgl", {
        preserveDrawingBuffer: true
    });
    // This fancier-looking version disables HTML-5's default screen-clearing, so 
    // that our drawMain() 
    // function will over-write previous on-screen results until we call the 
    // gl.clear(COLOR_BUFFER_BIT); function. )
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    gl.clearColor(0.2, 0.1, 0.3, 1); // RGBA color for clearing <canvas>

    gl.enable(gl.DEPTH_TEST);

    // Initialize each of our 'vboBox' objects: 
    worldBox.init(gl); // VBO + shaders + uniforms + attribs for our 3D world,
    // including ground-plane,                       
    GouraudBox.init(gl); //  "		"		"  for 1st kind of shading & lighting
    PhongBox.init(gl); //  "   "   "  for 2nd kind of shading & lighting
    frontEndInput()
    // ==============ANIMATION=============
    // Quick tutorials on synchronous, real-time animation in JavaScript/HTML-5: 
    //    https://webglfundamentals.org/webgl/lessons/webgl-animation.html
    //  or
    //  	http://creativejs.com/resources/requestanimationframe/
    //		--------------------------------------------------------
    // Why use 'requestAnimationFrame()' instead of the simpler-to-use
    //	fixed-time setInterval() or setTimeout() functions?  Because:
    //		1) it draws the next animation frame 'at the next opportunity' instead 
    //			of a fixed time interval. It allows your browser and operating system
    //			to manage its own processes, power, & computing loads, and to respond 
    //			to on-screen window placement (to skip battery-draining animation in 
    //			any window that was hidden behind others, or was scrolled off-screen)
    //		2) it helps your program avoid 'stuttering' or 'jittery' animation
    //			due to delayed or 'missed' frames.  Your program can read and respond 
    //			to the ACTUAL time interval between displayed frames instead of fixed
    //		 	fixed-time 'setInterval()' calls that may take longer than expected.
    //------------------------------------
    var tick = function() { // locally (within main() only), define our 
        // self-calling animation function. 
        setCamera();
        // g_canvasID.width = innerWidth * 0.98;
        // g_canvasID.height = innerHeight *0.75;
        requestAnimationFrame(tick, g_canvasID); // browser callback request; wait
        // til browser is ready to re-draw canvas, then
        timerAll(); // Update all time-varying params, and
        drawAll(); // Draw all the VBObox contents
        var xtraMargin = 20; // keep a margin (otherwise, browser adds scroll-bars)
        g_canvasID.width = (innerWidth - xtraMargin) * 0.99;
        g_canvasID.height = ((innerHeight * 3 / 4) - xtraMargin) * 0.99;
    };
    //------------------------------------
    tick(); // do it again!
}

function timerAll() {
    //=============================================================================
    // Find new values for all time-varying parameters used for on-screen drawing
    // use local variables to find the elapsed time.
    var nowMS = Date.now(); // current time (in milliseconds)
    var elapsed = nowMS - dateNow; // 
    dateNow = nowMS; // update for next webGL drawing.
    if (elapsed > 1000.0) {
        // Browsers won't re-draw 'canvas' element that isn't visible on-screen 
        // (user chose a different browser tab, etc.); when users make the browser
        // window visible again our resulting 'elapsedMS' value has gotten HUGE.
        // Instead of allowing a HUGE change in all our time-dependent parameters,
        // let's pretend that only a nominal 1/30th second passed:
        elapsed = 1000.0 / 30.0;
    }
    // Find new time-dependent parameters using the current or elapsed time:
    // Continuous rotation:
    g_angleNow1 = g_angleNow1 + (g_angleRate1 * elapsed) / 1000.0;
    g_angleNow1 %= 360.0;
}

function drawAll() {
    //=============================================================================
    // Clear on-screen HTML-5 <canvas> object:
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    g_myMaterial = getMatl();
    g_shiny = document.getElementById("shiny").value;
    setCamera();
    if (g_show0 == 1) { // IF user didn't press HTML button to 'hide' VBO0:
        worldBox.switchToMe(); // Set WebGL to render from this VBObox.
        worldBox.adjust(); // Send new values for uniforms to the GPU, and
        worldBox.draw(); // draw our VBO's contents using our shaders.
    }
    if (g_show1 == 1) { // IF user didn't press HTML button to 'hide' VBO1:
        GouraudBox.switchToMe(); // Set WebGL to render from this VBObox.
        GouraudBox.adjust(); // Send new values for uniforms to the GPU, and
        GouraudBox.draw(); // draw our VBO's contents using our shaders.
    }
    if (g_show2 == 1) { // IF user didn't press HTML button to 'hide' VBO2:
        PhongBox.switchToMe(); // Set WebGL to render from this VBObox.
        PhongBox.adjust(); // Send new values for uniforms to the GPU, and
        PhongBox.draw(); // draw our VBO's contents using our shaders.
    }
    /* // ?How slow is our own code?  	
    var aftrDraw = Date.now();
    var drawWait = aftrDraw - b4Draw;
    console.log("wait b4 draw: ", b4Wait, "drawWait: ", drawWait, "mSec");
    */
}

function ShadingControl(val) {
    value = val.value;
    if (value == 0) {
        g_show1 = 1;
        g_show2 = 0;
        g_showBlinn = true;
    } else if (value == 1) {
        g_show1 = 1;
        g_show2 = 0;
        g_showBlinn = false;
    } else if (value == 2) {
      g_show1 = 0;
      g_show2 = 1;
        g_showBlinn = true;
    } else if (value == 3) {
        g_show1 = 0;
        g_show2 = 1;
        g_showBlinn = false;
    }
}

function setCamera() {
    //============================================================================
    // PLACEHOLDER:  sets a fixed camera at a fixed position for use by
    // ALL VBObox objects.  REPLACE This with your own camera-control code.
    g_worldMat.setIdentity();

    gl.viewport(0, // Viewport lower-left corner
        0, // location(in pixels)
        g_canvasID.width, // viewport width,
        g_canvasID.height); // viewport height in pixels.
    g_worldMat.perspective(35, g_canvasID.width / g_canvasID.height, 1.0, 500.0);

    g_worldMat.lookAt(g_EyeX, g_EyeY, g_EyeZ, // center of projection
        g_LookAtX, g_LookAtY, g_LookatZ, // look-at point
        0, 0, 1);
    // READY to draw in the 'world' coordinate system.
    //------------END COPY
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
            } else {
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
            g_EyeX += rotatedX; // INCREASED for perspective camera)
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

function myMouseDown(ev) {
    //==============================================================================
    // Called when user PRESSES down any mouse button;
    // 									(Which button?    console.log('ev.button='+ev.button);   )
    // 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage
    //		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)

    // Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
    var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
    var xp = ev.clientX - rect.left; // x==0 at canvas left edge
    var yp = g_canvasID.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge

    // Convert to Canonical View Volume (CVV) coordinates too:
    var x = (xp - g_canvasID.width / 2) / // move origin to center of canvas and
        (g_canvasID.width / 2); // normalize canvas to -1 <= x < +1,
    var y = (yp - g_canvasID.height / 2) / //										 -1 <= y < +1.
        (g_canvasID.height / 2);
    //	console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);

    g_isDrag = true; // set our mouse-dragging flag
    g_xMclik = x; // record where mouse-dragging began
    g_yMclik = y;
}

function myMouseMove(ev) {
    //==============================================================================
    // Called when user MOVES the mouse with a button already pressed down.
    // 									(Which button?   console.log('ev.button='+ev.button);    )
    // 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage
    //		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)

    if (g_isDrag == false) return; // IGNORE all mouse-moves except 'dragging'

    // Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
    var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
    var xp = ev.clientX - rect.left; // x==0 at canvas left edge
    var yp = g_canvasID.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
    //  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);

    // Convert to Canonical View Volume (CVV) coordinates too:
    var x = (xp - g_canvasID.width / 2) / // move origin to center of canvas and
        (g_canvasID.width / 2); // normalize canvas to -1 <= x < +1,
    var y = (yp - g_canvasID.height / 2) / //									-1 <= y < +1.
        (g_canvasID.height / 2);
    //	console.log('myMouseMove(CVV coords  ):  x, y=\t',x,',\t',y);

    // find how far we dragged the mouse:
    g_xMdragTot += (x - g_xMclik); // Accumulate change-in-mouse-position,&
    g_yMdragTot += (y - g_yMclik);
    dragQuat(x - g_xMclik, y - g_yMclik);
    // Report new mouse position & how far we moved on webpage:
    g_xMclik = x; // Make next drag-measurement from here.
    g_yMclik = y;
}

function myMouseUp(ev) {
    //==============================================================================
    // Called when user RELEASES mouse button pressed previously.
    // 									(Which button?   console.log('ev.button='+ev.button);    )
    // 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage
    //		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)

    // Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
    var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
    var xp = ev.clientX - rect.left; // x==0 at canvas left edge
    var yp = g_canvasID.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
    //  console.log('myMouseUp  (pixel coords):\n\t xp,yp=\t',xp,',\t',yp);

    // Convert to Canonical View Volume (CVV) coordinates too:
    var x = (xp - g_canvasID.width / 2) / // move origin to center of canvas and
        (g_canvasID.width / 2); // normalize canvas to -1 <= x < +1,
    var y = (yp - g_canvasID.height / 2) / //										 -1 <= y < +1.
        (g_canvasID.height / 2);

    g_isDrag = false;
    g_xMdragTot += (x - g_xMclik);
    g_yMdragTot += (y - g_yMclik);
    dragQuat(x - g_xMclik, y - g_yMclik);
}

function dragQuat(xdrag, ydrag) {
    //==============================================================================
    // Called when user drags mouse by 'xdrag,ydrag' as measured in CVV coords.
    // We find a rotation axis perpendicular to the drag direction, and convert the
    // drag distance to an angular rotation amount, and use both to set the value of
    // the quaternion qNew.  We then combine this new rotation with the current
    // rotation stored in quaternion 'qTot' by quaternion multiply.  Note the
    // 'draw()' function converts this current 'qTot' quaternion to a rotation
    // matrix for drawing.
    var qTmp = new Quaternion(0, 0, 0, 1);

    var dist = Math.sqrt(xdrag * xdrag + ydrag * ydrag);
    // console.log('xdrag,ydrag=',xdrag.toFixed(5),ydrag.toFixed(5),'dist=',dist.toFixed(5));
    qNew.setFromAxisAngle(-ydrag + 0.0001, xdrag + 0.0001, 0.0, dist * 150.0);
    // (why add tiny 0.0001? To ensure we never have a zero-length rotation axis)
    // why axis (x,y,z) = (-yMdrag,+xMdrag,0)?
    // -- to rotate around +x axis, drag mouse in -y direction.
    // -- to rotate around +y axis, drag mouse in +x direction.

    qTmp.multiply(qNew, qTot); // apply new rotation to current rotation.
    //--------------------------
    // IMPORTANT! Why qNew*qTot instead of qTot*qNew? (Try it!)
    // ANSWER: Because 'duality' governs ALL transformations, not just matrices.
    // If we multiplied in (qTot*qNew) order, we would rotate the drawing axes
    // first by qTot, and then by qNew--we would apply mouse-dragging rotations
    // to already-rotated drawing axes.  Instead, we wish to apply the mouse-drag
    // rotations FIRST, before we apply rotations from all the previous dragging.
    //------------------------
    // IMPORTANT!  Both qTot and qNew are unit-length quaternions, but we store
    // them with finite precision. While the product of two (EXACTLY) unit-length
    // quaternions will always be another unit-length quaternion, the qTmp length
    // may drift away from 1.0 if we repeat this quaternion multiply many times.
    // A non-unit-length quaternion won't work with our quaternion-to-matrix fcn.
    // Matrix4.prototype.setFromQuat().
    qTmp.normalize(); // normalize to ensure we stay at length==1.0.
    qTot.copy(qTmp);
}

function getMatl() {
    matlSelect = document.getElementById('materials').value;
    if (matlSelect == g_myMaterial) return g_myMaterial
    var matl = new Material(parseInt(matlSelect));
    g_shinyUser = matl.K_shiny;
    document.getElementById('shiny').value = g_shinyUser;
    return matlSelect;
}

function frontEndInput() {
    g_lightXPos = document.getElementById('posX').value;
    g_lightYPos = document.getElementById('posY').value;
    g_lightZPos = document.getElementById('posZ').value;

    g_lightRAmbi = document.getElementById('ambiR').value;
    g_lightGAmbi = document.getElementById('ambiG').value;
    g_lightBAmbi = document.getElementById('ambiB').value;

    g_lightRDiff = document.getElementById('diffR').value;
    g_lightGDiff = document.getElementById('diffG').value;
    g_lightBDiff = document.getElementById('diffB').value;

    g_lightRSpec = document.getElementById('specR').value;
    g_lightGSpec = document.getElementById('specG').value;
    g_lightBSpec = document.getElementById('specB').value;
}


function LightControl(selectObject) {
    var value = selectObject.value;
    if (value == 1) {
        g_lightXPos = g_lightXPos_old
        g_lightYPos = g_lightYPos_old
        g_lightZPos = g_lightZPos_old
        g_lightRAmbi = g_lightRAmbi_old
        g_lightGAmbi = g_lightGAmbi_old
        g_lightBAmbi = g_lightBAmbi_old
        g_lightRDiff = g_lightRDiff_old
        g_lightGDiff = g_lightGDiff_old
        g_lightBDiff = g_lightBDiff_old
        g_lightRSpec = g_lightRSpec_old
        g_lightGSpec = g_lightGSpec_old
        g_lightBSpec = g_lightBSpec_old

    } else {
        g_lightXPos_old = g_lightXPos;
        g_lightYPos_old = g_lightYPos;
        g_lightZPos_old = g_lightZPos;
        g_lightRAmbi_old = g_lightRAmbi;
        g_lightGAmbi_old = g_lightGAmbi;
        g_lightBAmbi_old = g_lightBAmbi;
        g_lightRDiff_old = g_lightRDiff;
        g_lightGDiff_old = g_lightGDiff;
        g_lightBDiff_old = g_lightBDiff;
        g_lightRSpec_old = g_lightRSpec;
        g_lightGSpec_old = g_lightGSpec;
        g_lightBSpec_old = g_lightBSpec;

        g_lightXPos = 0;
        g_lightYPos = 0;
        g_lightZPos = 0;
        g_lightRAmbi = 0;
        g_lightGAmbi = 0;
        g_lightBAmbi = 0;
        g_lightRDiff = 0;
        g_lightGDiff = 0;
        g_lightBDiff = 0;
        g_lightRSpec = 0;
        g_lightGSpec = 0;
        g_lightBSpec = 0;

    }
}