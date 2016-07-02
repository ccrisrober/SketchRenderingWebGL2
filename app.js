var canvas = document.getElementById('myCanvas');
var requestID;
function getContext(canvas) {
    var contexts = "webgl2,experimental-webgl2".split(",");
    var gl;
    var ctx;
    for (var i = 0; i < contexts.length; i++) {
        ctx = contexts[i];
        gl = canvas.getContext(ctx);
        if (gl) {
            return gl;
        }
    }
    return null;
}
function getVendors() {
    var vendors = "ms,moz,webkit,o".split(",");
    if (!window.requestAnimationFrame) {
        var vendor;
        for (var i = 0; i < vendors.length; i++) {
            vendor = vendors[i];
            window.requestAnimationFrame = window[vendor + 'RequestAnimationFrame'];
            window.cancelAnimationFrame = window[vendor + 'CancelAnimationFrame'] || window[vendor + 'CancelRequestAnimationFrame'];
            if (window.requestAnimationFrame) {
                break;
            }
        }
    }
}
var gl = getContext(canvas);
getVendors();
var size = [ canvas.width, canvas.height ];

if (!gl) {
    alert('Your browser does not support WebGL2');
}
gl.getExtension("OES_texture_float_linear");

var normalsProgram = new ShaderProgram();
var outlineProgram = new ShaderProgram();
var blurProgram = new ShaderProgram();

function createFBO() {
    var texWidth = canvas.clientWidth;
    var texHeight = canvas.clientHeight;

    var colorTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, colorTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texWidth, texHeight, 0, gl.RGBA, gl.FLOAT, null);
    gl.bindTexture(gl.TEXTURE_2D, null);

    // create a renderbuffer object to store depth info
    var rboId;
    rboId = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, rboId);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, texWidth, texHeight);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);

    // create a framebuffer object
    var depthFbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, depthFbo);

    // attach the texture to FBO color attachment point
    gl.framebufferTexture2D(gl.FRAMEBUFFER,        // 1. fbo target: gl.FRAMEBUFFER 
                           gl.COLOR_ATTACHMENT0,  // 2. attachment point
                           gl.TEXTURE_2D,         // 3. tex target: gl.TEXTURE_2D
                           colorTexture,             // 4. tex ID
                           0);                    // 5. mipmap level: 0(base)

    // attach the renderbuffer to depth attachment point
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER,      // 1. fbo target: gl.FRAMEBUFFER
                              gl.DEPTH_ATTACHMENT, // 2. attachment point
                              gl.RENDERBUFFER,     // 3. rbo target: gl.RENDERBUFFER
                              rboId);              // 4. rbo ID

    // check FBO status
    var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    var fboUsed = true;
    if(status != gl.FRAMEBUFFER_COMPLETE)
        fboUsed = false;
    console.log(fboUsed);
    // switch back to window-system-provided framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return [colorTexture, depthFbo]
}
function createBuffer(data) {
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    return buffer;
}
function addAttrib(attr_name, buffer, numElems) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    var attribLocation = normalsProgram.attribLocations[attr_name];
    gl.vertexAttribPointer(
        attribLocation, // Attribute location
        numElems, // Number of elements per attribute
        gl.FLOAT, // Type of elements
        gl.FALSE,
        numElems * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
        0 // Offset from the beginning of a single vertex to this attribute
    );
    gl.enableVertexAttribArray(attribLocation);
}
function loadJSON(url, cb) {
    var request = new XMLHttpRequest();
    request.open('GET', url + '?please-dont-cache=' + Math.random(), true);
    request.onload = function () {
        if (request.status < 200 || request.status > 299) {
            console.log('Error: HTTP Status ' + request.status + ' on resource ' + url);
        } else {
            cb(JSON.parse(request.responseText));
        }
    };
    request.send();
}
function createQuad() {
    var positions = [
        -1.0,  -1.0, 
         1.0,  -1.0, 
        -1.0,   1.0, 
         1.0,   1.0
    ];

    var planeVAO = gl.createVertexArray();  
    gl.bindVertexArray(planeVAO);  
    var planeVertexVBO = gl.createBuffer();  
    gl.bindBuffer(gl.ARRAY_BUFFER, planeVertexVBO);  
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    return planeVAO;
}
function drawQuad(planeVAO) {
    gl.bindVertexArray(planeVAO);  
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);  
}
var init = function () {
    // Create depth program
    normalsProgram = new ShaderProgram();
    normalsProgram.addShader("shaders/normalRenderProgram.vert", gl.VERTEX_SHADER, mode.read_file);
    normalsProgram.addShader("shaders/normalRenderProgram.frag", gl.FRAGMENT_SHADER, mode.read_file);
    normalsProgram.compile_and_link();
    console.log("Depth Shader load ok");
    normalsProgram.addAttributes(["vertPosition", "vertNormal", "vertTexCoord"])
    normalsProgram.addUniforms(["model", "view", "projection"]);
    console.log(normalsProgram.uniformLocations);

    outlineProgram = new ShaderProgram();
    outlineProgram.addShader("shaders/absorptionShader.vert", gl.VERTEX_SHADER, mode.read_file);
    outlineProgram.addShader("shaders/absorptionShader.frag", gl.FRAGMENT_SHADER, mode.read_file);
    outlineProgram.compile_and_link();
    console.log("Absorption Shader load ok");
    console.log(outlineProgram.uniformLocations);

    blurProgram = new ShaderProgram();
    blurProgram.addShader("shaders/absorptionShader.vert", gl.VERTEX_SHADER, mode.read_file);
    blurProgram.addShader("shaders/blurProgram.frag", gl.FRAGMENT_SHADER, mode.read_file);
    blurProgram.compile_and_link();
    console.log("Absorption Shader load ok");
    console.log(outlineProgram.uniformLocations);

    loadJSON('dragon.json', function(modelObj) {
        RunDemo(modelObj);
    });
};

var RunDemo = function (ObjModel) {
    var simpleTexture, simpleNormalFBO;
    var _fbo = createFBO();
    simpleTexture = _fbo[0];
    simpleNormalFBO = _fbo[1];


    var outlineTexture, outlineFBO;
    var _fbo = createFBO();
    outlineTexture = _fbo[0];
    outlineFBO = _fbo[1];

    gl.enable(gl.DEPTH_TEST);
    var susanIndices = [].concat.apply([], ObjModel.meshes[0].faces);

    function createVAO(model, indicesArray) {
        var vao = gl.createVertexArray();  
        gl.bindVertexArray(vao);

        var indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indicesArray), gl.STATIC_DRAW);

        addAttrib("vertPosition", createBuffer(model.meshes[0].vertices), 3);
        addAttrib("vertNormal", createBuffer(model.meshes[0].normals), 3);
        //addAttrib("vertTexCoord", createBuffer(model.meshes[0].texturecoords[0]), 2);

        gl.bindVertexArray(null); 
        return vao;
    }

    var vao = createVAO(ObjModel, susanIndices);
    
    normalsProgram.use();

    var model = mat4.create();
    var view = mat4.create();
    var projection = mat4.create();
    mat4.identity(model);

    var cam = new Camera([0, 0, 8]);
    view = cam.GetViewMatrix();
    projection = cam.GetProjectionMatrix();
    gl.uniformMatrix4fv(normalsProgram.uniformLocations['view'], gl.FALSE, view);
    gl.uniformMatrix4fv(normalsProgram.uniformLocations['projection'], gl.FALSE, projection);

    var planeVAO = createQuad();

    var identityMatrix = mat4.create();
    mat4.identity(identityMatrix);
    var angle = 0;
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    var lastTime = Date.now();

    function updateMatrices() {
        var currentTime = Date.now();
        var timeElapsed = currentTime - lastTime;
        lastTime = currentTime;
        if(config.Rotate) { 
            angle += timeElapsed * 0.001;
            if(angle >= 180.0) {
                angle = -180.0;
            }
        }
        mat4.translate(model,identityMatrix, vec3.fromValues(0.0, -1.0, 0.0));
        mat4.rotateY(model, model, 90.0 * Math.PI / 180);
        mat4.rotateY(model, model, angle);
        mat4.scale(model, model, vec3.fromValues(0.35, 0.35, 0.35));
    }
    function renderNormals() {
        normalsProgram.use();
        gl.uniformMatrix4fv(normalsProgram.uniformLocations["model"], gl.FALSE, model);

        gl.bindFramebuffer(gl.FRAMEBUFFER, simpleNormalFBO);
        gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.bindVertexArray(vao);  
        gl.drawElements(gl.TRIANGLES, susanIndices.length, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
    }

    function renderOutline() {
        outlineProgram.use();

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.bindTexture(gl.TEXTURE_2D, simpleTexture );
        drawQuad(planeVAO);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    function renderOutlineAndBlur() {
        outlineProgram.use();

        gl.bindFramebuffer(gl.FRAMEBUFFER, outlineFBO);
        gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.bindTexture(gl.TEXTURE_2D, simpleTexture );
        drawQuad(planeVAO);
        gl.bindTexture(gl.TEXTURE_2D, null);

        blurProgram.use();

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.bindTexture(gl.TEXTURE_2D, outlineTexture );
        drawQuad(planeVAO);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    var render = function () {
        if(requestID) {
            if (gl.NO_ERROR != gl.getError()) {
                alert(gl.getError());
            }
            stats.begin();

            updateMatrices();
            renderNormals();
            if(config.Blur) {
                renderOutlineAndBlur();
            } else {
                renderOutline();
            }

            stats.end();
        }

        window.requestAnimationFrame(render);
    };
    requestID = window.requestAnimationFrame(render);
};

var Config = function() {
    this.Rotate = true;
    this.Blur = true;
};

var config;
var stats = new Stats();

window.addEventListener("load", function () {
    stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild( stats.domElement );
    config = new Config();
    gui = new dat.GUI();
    gui.add(config, "Rotate");
    gui.add(config, "Blur");
    init();

    /*unction readSingleFile(e) {
        console.log("NEW FILE");
        var aux = requestID;
        if (requestID) {
            window.cancelAnimationFrame(requestID);
            requestID = undefined;
        }
        var file = e.target.files[0];
        if (!file) {
            return;
        }
        var reader = new FileReader();
        reader.onload = function(e) {
            var contents = e.target.result;
            displayContents(contents);
            requestID = aux;
        };
        reader.readAsText(file);
    }

    function displayContents(contents) {
        var element = document.getElementById('file-content');
        element.innerHTML = contents;
    }

    document.getElementById('file-input').addEventListener('change', readSingleFile, false);*/
});