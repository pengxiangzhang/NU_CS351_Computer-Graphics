// project_a.js By Pengxiang Zhang
//
// Credit: 
// This project used the starter code provide from the textbook
// Chapter 5: ColoredTriangle.js (c) 2012 matsuda  AND
// Chapter 4: RotatingTriangle_withButtons.js (c) 2012 matsuda AND
// Chapter 2: ColoredPoints.js (c) 2012 matsuda
// and merged and modified to became: ControlMulti.js for EECS 351-1, 
// Northwestern Univ. Jack Tumblin
//
// ------------Vertex shader program------------
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

// ------------Fragment shader program------------
var FSHADER_SOURCE =
    //  '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    //  '#endif GL_ES\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_FragColor = v_Color;\n' +
    '}\n';

// Global Variables
//------------For WebGL------------
var gl;
var g_canvas = document.getElementById('webgl');
// ------------For tetrahedron & its matrix------------
var g_vertsMax = 0;
var g_modelMatrix = new Matrix4();
var g_modelMatLoc;
//------------For Animation------------
var g_isRun = true;
var g_lastMS = Date.now();
var g_angle01 = 0;
var g_angle01Rate = 100;
var g_angle02 = 0;
var g_angle02Rate = 1000;
var g_move = 0;
var g_moveRate = 0.01;
//------------For mouse click-and-drag------------
var g_isDrag = false;
var g_xMclik = 0.0;
var g_yMclik = 0.0;
var g_xDragTo = 0.0;
var g_yDragTo = 0.0;
var g_digits = 5;
//------------For keyboard moving------------
var g_xKeyTo = 0.0;
var g_yKeyTo = 0.0;
var g_xKeySpin = 0.0;
var g_yKeySpin = 0.0;
document.getElementById("move").textContent = g_moveRate; 
document.getElementById("spin").value = g_angle01Rate; 

function main() {
    gl = getWebGLContext(g_canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }
    g_maxVerts = initVertexBuffer(gl);
    if (g_maxVerts < 0) {
        console.log('Failed to set the vertex information');
        return;
    }
    window.addEventListener("keydown", myKeyDown, false);
    window.addEventListener("mousedown", myMouseDown);
    window.addEventListener("mousemove", myMouseMove);
    window.addEventListener("mouseup", myMouseUp);
    gl.clearColor(0.305, 0.164, 0.517, 1.0);
    gl.depthFunc(gl.LESS);
    gl.enable(gl.DEPTH_TEST);
    g_modelMatLoc = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!g_modelMatLoc) {
        console.log('Failed to get the storage location of u_ModelMatrix');
        return;
    }
    var tick = function () {
        animate();
        drawAll();
        requestAnimationFrame(tick, g_canvas);
    };
    tick();

}

function initVertexBuffer() {
    var c30 = Math.sqrt(0.75);
    var sq2 = Math.sqrt(2.0);
    var node = new Float32Array([
        // ------------A------------
        // 0.0,0.0,0.0,1.0,    0.970, 0.000, 0.000, // Node 0
        // 0.5,0.0,0.0,1.0,    0.970, 0.000, 0.857, // Node 1
        // 0.5,0.0,1.0,1.0,    0.000, 0.097, 0.970, // Node 2
        // 0.0,0.0,1.0,1.0,    0.000, 0.954, 0.970, // Node 3
        // 0.0,2.0,0.0,1.0,    0.000, 0.970, 0.372, // Node 4
        // 0.5,2.0,0.0,1.0,    0.938, 0.970, 0.000, // Node 5
        // 0.5,2.0,1.0,1.0,    0.970, 0.097, 0.000, // Node 6
        // 0.0,2.0,1.0,1.0,    0.270, 0.270, 0.267, // Node 7

        // ------------B------------
        // 0.0,0.0,0.0,1.0,    0.970, 0.000, 0.000, // Node 0
        // 1.0,0.0,0.0,1.0,    0.970, 0.000, 0.857, // Node 1
        // 1.0,0.0,1.0,1.0,    0.000, 0.097, 0.970, // Node 2
        // 0.0,0.0,1.0,1.0,    0.000, 0.954, 0.970, // Node 3
        // 0.0,1.0,0.0,1.0,    0.000, 0.970, 0.372, // Node 4
        // 1.0,1.0,0.0,1.0,    0.938, 0.970, 0.000, // Node 5
        // 1.0,1.0,1.0,1.0,    0.970, 0.097, 0.000, // Node 6
        // 0.0,1.0,1.0,1.0,    0.270, 0.270, 0.267, // Node 7

        // ------------C------------
        // 0.0,0.0,0.0,1.0,    0.970, 0.000, 0.000, // Node 0
        // 1.0,0.0,0.0,1.0,    0.970, 0.000, 0.857, // Node 1
        // 1.0,0.0,1.0,1.0,    0.000, 0.097, 0.970, // Node 2
        // 0.0,0.0,1.0,1.0,    0.000, 0.954, 0.970, // Node 3
        // 1.0,1.0,0.0,1.0,    0.000, 0.970, 0.372, // Node 4
        // 2.0,1.0,0.0,1.0,    0.938, 0.970, 0.000, // Node 5
        // 2.0,1.0,1.0,1.0,    0.970, 0.097, 0.000, // Node 6
        // 1.0,1.0,1.0,1.0,    0.270, 0.270, 0.267, // Node 7
    ])

    var colorShapes = new Float32Array([
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
    g_vertsMax = 36;
    var shapeBufferHandle = gl.createBuffer();
    if (!shapeBufferHandle) {
        console.log('Failed to create the shape buffer object');
        return false;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, shapeBufferHandle);
    gl.bufferData(gl.ARRAY_BUFFER, colorShapes, gl.STATIC_DRAW);

    var FSIZE = colorShapes.BYTES_PER_ELEMENT;
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    gl.vertexAttribPointer(
        a_Position,
        4,
        gl.FLOAT,
        false,
        FSIZE * 7,
        0);
    // value we will actually use?
    gl.enableVertexAttribArray(a_Position);
    var a_Color = gl.getAttribLocation(gl.program, 'a_Color');

    if (a_Color < 0) {
        console.log('Failed to get the storage location of a_Color');
        return -1;
    }
    gl.vertexAttribPointer(
        a_Color,
        3,
        gl.FLOAT,
        false,
        FSIZE * 7,
        FSIZE * 4);
    gl.enableVertexAttribArray(a_Color);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function DrawTap() {
    g_modelMatrix.setTranslate(-0.5, -0.5, -0.5);
    g_modelMatrix.scale(1, 1, -1);
    g_modelMatrix.scale(0.3, 0.3, 0.3);
    var dist = Math.sqrt(g_xDragTo * g_xDragTo + g_yDragTo * g_yDragTo);
    g_modelMatrix.rotate(dist * 120.0, -g_yDragTo + 0.0001, g_xDragTo + 0.0001, 0.0);
    gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, 0, 36);

    g_modelMatrix.translate(0.5, 2.0, 0.0);
    g_modelMatrix.scale(0.6, 0.6, 1);
    g_modelMatrix.rotate(-90, 0, 0)
    gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
    pushMatrix(g_modelMatrix);

}

function DrawOutlet(x, y, z) {
    g_modelMatrix = popMatrix();
    pushMatrix(g_modelMatrix);
    g_modelMatrix.translate(x, y, z);
    g_modelMatrix.scale(0.2, 0.2, 0.2);
    g_modelMatrix.rotate(g_angle01, 0, 0, 1);
    gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, 36, 48);
    g_modelMatrix.translate(2,1,1);
    g_modelMatrix.rotate(g_angle02, 0, 0, 1);
    gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, 36, 48);
}

function DrawWater(x, y, z) {
    g_modelMatrix = popMatrix();
    pushMatrix(g_modelMatrix);
    g_modelMatrix.translate(x, y, z);
    g_modelMatrix.scale(0.2, 0.2, 0.2);
    g_modelMatrix.rotate(g_angle01, 0, 0, 1);
    gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);  
    gl.drawArrays(gl.TRIANGLES, 36, 48);
}

function DrawControl(x,y,z,control) {
    g_modelMatrix.setTranslate(x,y,z);
    g_modelMatrix.scale(1, 1, -1);
    g_modelMatrix.scale(0.1, 0.1, 0.1);
    var dist = Math.sqrt(g_xDragTo * g_xDragTo + g_yDragTo * g_yDragTo);
    g_modelMatrix.rotate(0.186 * 120.0, -g_yDragTo + 0.0001, g_xDragTo + 0.0001, 0.0);
    g_modelMatrix.rotate(control, 0, 0, 1);
    gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, 84, 42);
    
}

function drawAll() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    clrColr = new Float32Array(4);
    clrColr = gl.getParameter(gl.COLOR_CLEAR_VALUE);
    DrawTap()
    DrawOutlet(0.5, 1.5, 0.5)
    DrawOutlet(0.5, 2, 0.5)
    DrawWater(1 + g_move, 1.8, 0.5)
    DrawWater(1.5 + g_move, 1.8, 0.5)
    DrawWater(2 + g_move, 1.8, 0.5)
    DrawControl(0.5,0.5,0.5,g_xKeySpin)
    DrawControl(0.5,0,0.5,g_yKeySpin)
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

function myMouseDown() {
    g_isDrag = true;
};

function myMouseMove(ev) {
    if (g_isDrag == false) return;
    var rect = ev.target.getBoundingClientRect();
    var xp = ev.clientX - rect.left;
    var yp = g_canvas.height - (ev.clientY - rect.top);
    var x = (xp - g_canvas.width / 2) / (g_canvas.width / 2);
    var y = (yp - g_canvas.height / 2) / (g_canvas.height / 2);
    g_xDragTo += (x - g_xDragTo);
    g_yDragTo += (y - g_yDragTo);
    g_xDragTo = x;
    g_yDragTo = y;
};

function myMouseUp() {
    g_isDrag = false;
};

function myKeyDown(kev) {
    switch (kev.code) {
        case "KeyA":
        case "ArrowLeft":
            if (g_moveRate > 0) {
                g_moveRate -= 0.01;
                g_yKeySpin += 5;
                document.getElementById("move").textContent = g_moveRate; 
            }
            else{
                g_moveRate = 0;
                alert("Already Stopped")
                document.getElementById("move").textContent = g_moveRate; 
            }

            break;
        case "KeyD":
        case "ArrowRight":
            g_moveRate += 0.01;
            g_yKeySpin -= 5;
            document.getElementById("move").textContent = g_moveRate; 
            break;
        case "KeyS":
        case "ArrowDown":
            g_angle01Rate -= 50;
            g_xKeySpin -=1;
            document.getElementById("spin").value = g_angle01Rate; 
            break;
        case "KeyW":
        case "ArrowUp":
            g_angle01Rate += 50;
            g_xKeySpin += 1;
            document.getElementById("spin").value = g_angle01Rate; 
            break;
    }

}
function upDateSpinRate(value) {
    g_angle01Rate = value
    g_xKeySpin = value/50
}

function changeColor(value) {
    console.log(value)
}
