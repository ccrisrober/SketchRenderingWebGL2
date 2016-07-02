"use strict";var mode;!function(a){a[a.read_file=0]="read_file",a[a.read_script=1]="read_script",a[a.read_text=2]="read_text"}(mode||(mode={}));var ShaderProgram=function(){function a(){this.uniformLocations={},this.attribLocations={},this.shaders=[]}return a.prototype.addAttributes=function(a){for(var b in a)b=a[b],this.attribLocations[b]=gl.getAttribLocation(this.mCompiledShader,b)},a.prototype.addUniforms=function(a){for(var b in a)b=a[b],this.uniformLocations[b]=gl.getUniformLocation(this.mCompiledShader,b)},a.prototype.program=function(){return this.mCompiledShader},a.prototype.addShader=function(a,b,c){var d;c==mode.read_file?d=this.loadAndCompileWithFile(a,b):c==mode.read_script?d=this.loadAndCompile(a,b):c==mode.read_text&&(d=this.loadAndCompileFromText(a,b)),this.shaders.push(d)},a.prototype.compile_and_link=function(){this.mCompiledShader=gl.createProgram();for(var a=0;a<this.shaders.length;a++)gl.attachShader(this.mCompiledShader,this.shaders[a]);if(gl.linkProgram(this.mCompiledShader),!gl.getProgramParameter(this.mCompiledShader,gl.LINK_STATUS))throw alert("ERROR"),console.warn("Error in program linking:"+gl.getProgramInfoLog(this.mCompiledShader)),console.log(this.fragmentSource),"SHADER ERROR";return!0},a.prototype.loadAndCompileWithFile=function(a,b){var c=new XMLHttpRequest;c.open("GET",a,!1);try{c.send()}catch(d){return alert("ERROR: "+a),console.log("ERROR: "+a),null}var e=c.responseText;if(null===e)throw alert("WARNING: "+a+" failed"),console.log(this.fragmentSource),"SHADER ERROR";return this.compileShader(e,b)},a.prototype.loadAndCompileFromText=function(a,b){if(null===a)throw alert("WARNING: "+a+" failed"),console.log(this.fragmentSource),"SHADER ERROR";return this.compileShader(a,b)},a.prototype.loadAndCompile=function(a,b){var c,d;if(c=document.getElementById(a),d=c.firstChild.textContent,null===d)throw alert("WARNING: "+a+" failed"),console.log(this.fragmentSource),"SHADER ERROR";return this.compileShader(d,b)},a.prototype.compileShader=function(a,b){var c;if(b==gl.VERTEX_SHADER?this.vertexSource=a:b==gl.FRAGMENT_SHADER&&(this.fragmentSource=a),c=gl.createShader(b),gl.shaderSource(c,a),gl.compileShader(c),!gl.getShaderParameter(c,gl.COMPILE_STATUS))throw alert("ERROR: "+gl.getShaderInfoLog(c)),console.log("ERROR: "+gl.getShaderInfoLog(c)),console.log(this.fragmentSource),"SHADER ERROR";return c},a.prototype.use=function(){gl.useProgram(this.mCompiledShader)},a.prototype.dispose=function(){},a}();