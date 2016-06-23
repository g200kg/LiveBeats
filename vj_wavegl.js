// vj_video.js : vj command line text display
//
// Should define same name function as
// function(param)
//	param={
//		'w':elementWidth,
//		'h':elementHeight,
//		'txt':texts
//		'wavedat':timeDomainDataUint8Array,
//		'freqdat':freqDomainDataUint8Array
//	}
//
// Return object should define:
//	this.elem : dom-element of this plugin
//	this.anim : animation callback function
//	this.param : control parameter list.
//		number or string, number value range is recommended to 0.0-1.0 for typical use.
//		following params are pre-defined at host.
//		'a' : alpha
//		'b' : blur
//		'h' : height
//		'w' : width
//		'x' : x-pos
//		'y' : y-pos
//		'z' : zoom ratio
//		'r' : rotate
//

vj_wave = function(param){
	var vj_video_vs="\
		attribute vec3 position;\
		void main(void){\
			gl_Position = vec4(position, 1.0);\
		}";
	var vj_video_fsdiff="\
		precision mediump float;\
		uniform vec2 resolution;\
		uniform sampler2D textureCur;\
		uniform sampler2D texturePre;\
		uniform sampler2D textureDiff;\
		void main(void){\
			vec2 uv=gl_FragCoord.xy/resolution.xy;\
			vec4 cur=texture2D(textureCur,uv);\
			vec4 pre=texture2D(texturePre,uv);\
			vec4 diff=texture2D(textureDiff,uv);\
			vec4 d=abs(cur-pre);\
			float v=max(d.x+d.y+d.z,diff.x*0.9);\
			float sumx=0.0;\
			float sumy=0.0;\
			if(uv.y>0.99) {\
				for(int i=0;i<20;++i) {\
					float py=float(i)/20.0;\
					vec2 p=vec2(uv.x,py);\
					sumx+=texture2D(textureDiff,p).x;\
				}\
				sumx=sumx*0.05;\
			}\
			if(uv.x>0.99) {\
				for(int i=0;i<20;++i) {\
					float px=float(i)/20.0;\
					vec2 p=vec2(px,uv.y);\
					sumy+=texture2D(textureDiff,p).x;\
				}\
				sumy=sumy*0.05;\
			}\
			gl_FragColor=vec4(v,sumx,sumy,0);\
		}";
	var vj_video_fsscr="\
		precision mediump float;\
		uniform float time;\
		uniform vec2 resolution;\
		uniform vec3 cursor;\
		uniform sampler2D textureWav;\
		uniform sampler2D textureBack;\
		uniform float eff_hue;\
		uniform float eff_line;\
		uniform int eff_type;\
		uniform float eff_mosaic;\
		uniform float eff_wave;\
		uniform float scale;\
		uniform float rot;\
		float plasma(vec2 p){\
		  p*=10.0;\
		  return (sin(p.x+time*0.001)*0.25+0.25)+(sin(p.y*time*0.121)*0.25+0.25);\
		}\
		vec2 trans(vec2 p){\
			float theta = atan(p.y, p.x);\
			float r = length(p)-0.3;\
			return vec2(theta*.25, r);\
		}\
		vec3 hsv2rgb(vec3 c) {\
  		vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);\
  		vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);\
  		return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);\
		}\
		void main() {\
			vec2 p=(gl_FragCoord.xy*2.-resolution)/resolution;\
			float th=atan(p.y,p.x)+rot;\
			float r=length(p)/scale;\
			p.x=cos(th)*r; p.y=sin(th)*r;\
			vec2 p2=p;\
			if(eff_type==2)\
				p2=trans(p);\
			float v=texture2D(textureWav,vec2((p2.x+1.)*.5,0.)).x;\
			vec4 b=texture2D(textureBack,p);\
			float rr=pow(max(0.,1.-distance(p2+vec2(0.,+.5),vec2(p2.x,v))),11.0);\
			float rr4=pow(rr,10.0/eff_line);\
			rr=max(rr*.25,rr4);\
			gl_FragColor=vec4(hsv2rgb(vec3(eff_hue,1.-rr4,rr)),0.);\
		}";
		this.createFramebuffer=function(w, h) {
			var frameBuff = gl.createFramebuffer();
			var tex = gl.createTexture();
			gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuff);
			gl.bindTexture(gl.TEXTURE_2D, tex);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
			gl.bindTexture(gl.TEXTURE_2D, null);
			gl.bindRenderbuffer(gl.RENDERBUFFER, null);
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			return {"f":frameBuff, "t":tex};
		}


	this.audioctx=param.audioctx;
	this.wavedat=param.wavedat;
	this.freqdat=param.freqdat;
	this.dest=param.dest;
	this.senddest=param.senddest;

	param.w=512;
	param.h=512;

	this.w=param.w;
	this.h=param.h;

	this.video=param.video;
	this.wavimgdat=document.createElement("canvas").getContext("2d").createImageData(512,1);
	this.elem=document.createElement("canvas");
	this.elem.width=this.w;
	this.elem.height=this.h;

	this.sizex=param.w;
	this.sizey=param.h;

	var gl = this.elem.getContext("webgl") || this.elem.getContext("experimental-webgl");
	this.v_shader=gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(this.v_shader, vj_video_vs);
	gl.compileShader(this.v_shader);
	this.f_shaderdiff=gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(this.f_shaderdiff,vj_video_fsdiff);
	gl.compileShader(this.f_shaderdiff);
	this.f_shaderscr=gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(this.f_shaderscr,vj_video_fsscr);
	gl.compileShader(this.f_shaderscr);
	if(!gl.getShaderParameter(this.v_shader, gl.COMPILE_STATUS))
		alert(gl.getShaderInfoLog(this.v_shader));
	if(!gl.getShaderParameter(this.f_shaderdiff, gl.COMPILE_STATUS))
		alert(gl.getShaderInfoLog(this.f_shaderdiff));
	if(!gl.getShaderParameter(this.f_shaderscr, gl.COMPILE_STATUS))
		alert(gl.getShaderInfoLog(this.f_shaderscr));

	this.prgdiff = gl.createProgram();
	gl.attachShader(this.prgdiff, this.v_shader);
	gl.attachShader(this.prgdiff, this.f_shaderdiff);
	gl.linkProgram(this.prgdiff);
	this.prgscr = gl.createProgram();
	gl.attachShader(this.prgscr, this.v_shader);
	gl.attachShader(this.prgscr, this.f_shaderscr);
	gl.linkProgram(this.prgscr);

	this.framebuf=[];
	this.framebuf[0]=this.createFramebuffer(this.sizex,this.sizey);
	this.framebuf[1]=this.createFramebuffer(this.sizex,this.sizey);
	this.frameidx=0;

	var vPosition=gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER,vPosition);
	gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,1,0, 1,1,0, -1,-1,0, 1,-1,0]),gl.STATIC_DRAW);
	var vAttLocation = gl.getAttribLocation(this.prgdiff, "position");
	gl.enableVertexAttribArray(vAttLocation);
	gl.vertexAttribPointer(vAttLocation, 3, gl.FLOAT, false, 0, 0);
	var texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1024, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

	var uniLocation = {};
	uniLocation.diff_resolution = gl.getUniformLocation(this.prgdiff,"resolution");
	uniLocation.diff_texturecur = gl.getUniformLocation(this.prgdiff,"textureCur");
	uniLocation.diff_texturepre = gl.getUniformLocation(this.prgdiff,"texturePre");
	uniLocation.diff_texturediff = gl.getUniformLocation(this.prgdiff,"textureDiff");
	uniLocation.scr_time = gl.getUniformLocation(this.prgscr,"time");
	uniLocation.scr_resolution = gl.getUniformLocation(this.prgscr,"resolution");
	uniLocation.scr_cursor = gl.getUniformLocation(this.prgscr,"cursor");
	uniLocation.scr_texturewav = gl.getUniformLocation(this.prgscr,"textureWav");
	uniLocation.scr_textureback = gl.getUniformLocation(this.prgscr,"textureBack");
	uniLocation.scr_wave = gl.getUniformLocation(this.prgscr,"eff_wave");
	uniLocation.scr_hue = gl.getUniformLocation(this.prgscr,"eff_hue");
	uniLocation.scr_line = gl.getUniformLocation(this.prgscr,"eff_line");
	uniLocation.scr_type = gl.getUniformLocation(this.prgscr,"eff_type");
	uniLocation.scr_rot = gl.getUniformLocation(this.prgscr,"rot");
	uniLocation.scr_z = gl.getUniformLocation(this.prgscr,"scale");
	gl.activeTexture(gl.TEXTURE0);
	this.levx=new Uint8Array(this.sizex*4);
	this.levy=new Uint8Array(this.sizey*4);
	this.param = {
		"a":{"value":1,				"type":"double",	"min":0,	"max":1},
		"line":{"value":2,		"type":"double",	"min":1,	"max":20},
		"type":{"value":0,		"type":"int",		"min":0,	"max":2},
		"anim":{"value":1,		"type":"int",		"min":0,	"max":1},
		"rot":{"value":0,			"type":"double","min":0,"max":1},
		"z":{"value":1,				"type":"double","min":0,"max":100},
		"fill":{"value":0,		"type":"int",		"min":0,	"max":1},
		"effb":{"value":0,		"type":"double",	"min":0,	"max":20},
		"effr":{"value":0.9,	"type":"double",	"min":0.9,	"max":0.99},
		"effx":{"value":0,		"type":"double",	"min":-20,	"max":20},
		"effy":{"value":0,		"type":"double",	"min":-20,	"max":20},
		"effz":{"value":1,		"type":"double",	"min":0.5,	"max":2},
		"hue":{"value":0,			"type":"double"},
		"bcol":{"value":"#fff",	"type":"string"},
	};
	this.starttime=0;
	this.px=0;
	this.py=0;
	this.pz=0;
	gl.useProgram(this.prgscr);

	this.anim=function(timestamp) {
		if(this.param.a.value==0)
			return;
		if(this.starttime==0)
			this.startime=timestamp;
		var dt=timestamp-this.lasttime;
		if(dt<50)
			return;
		this.lasttime=timestamp;
		if(this.param.anim.value>=.5){
			for(var i=0;i<512;++i) {
				var j=i<<2;
				this.wavimgdat.data[j]=this.wavedat[i];
				this.wavimgdat.data[j+3]=255;
			}
		}
		gl.uniform1f(uniLocation.scr_time,timestamp-this.starttime);
		gl.uniform2fv(uniLocation.scr_resolution,[this.w,this.h]);
		gl.uniform3fv(uniLocation.scr_cursor,[this.px,this.py,this.pz]);
		gl.activeTexture(gl.TEXTURE0);
//		gl.uniform1i(uniLocation.scr_texturecur,0);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.wavimgdat);
//		gl.activeTexture(gl.TEXTURE1);
//		gl.bindTexture(gl.TEXTURE_2D, this.framebuf[this.frameidx].t);
		gl.uniform1f(uniLocation.scr_hue,this.param.hue.value);
		gl.uniform1f(uniLocation.scr_line,this.param.line.value);
		gl.uniform1i(uniLocation.scr_type,this.param.type.value);
		gl.uniform1f(uniLocation.scr_rot,this.param.rot.value*3.14159265/180);
		gl.uniform1f(uniLocation.scr_z,this.param.z.value);

//		this.frameidx^=1;
//		gl.bindFramebuffer(gl.FRAMEBUFFER,this.framebuf[this.frameidx].f);
//		gl.drawArrays(gl.TRIANGLE_STRIP, 0,4);
//		gl.flush();

		gl.bindFramebuffer(gl.FRAMEBUFFER,null);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0,4);
		gl.flush();
	};
};
