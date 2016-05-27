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

vj_drop = function(param){
	var vj_vs="\
		attribute vec3 position;\
		void main(void){\
			gl_Position = vec4(position, 1.0);\
		}";
	var vj_fs="\
		precision mediump float;\
		uniform float time;\
		uniform int type;\
		uniform int mode;\
		uniform vec2 resolution;\
		uniform vec3 cursor;\
		uniform sampler2D textureCur;\
		uniform float hue;\
		uniform float eff_motion;\
		uniform int eff_kaleido;\
		uniform float eff_mosaic;\
		uniform float eff_wave;\
		vec3 hsv2rgb(vec3 c){\
			vec4 K = vec4(1., 2./3., 1./3., 3.);\
			vec3 p = abs(fract(c.xxx + K.xyz) * 6. - K.www);\
			return c.z * mix(K.xxx, clamp(p - K.xxx, 0., 1.), c.y);\
		}\
		void dots(vec2 p,float v){\
			p-=.5;\
		  p*=10.0;\
			p.y+=v*2.;\
		  float v2=-cos(p.x)*.25+(sin(p.y*4.*v*cos(time*.0003))*0.25+0.25);\
			gl_FragColor = vec4(hsv2rgb(vec3(hue,1.,v2)),0.);\
		}\
		void smoke(vec2 uv,float v){\
			uv*=4.0;\
			float i0=3.14;\
			vec2 i4=vec2(0.,0.);\
			for(int s=0;s<5;s++){\
				vec2 r=vec2(sin(uv.y*i0-i4.y),cos(uv.x*i0+i4.x))/2.;\
				uv+=r;\
				i0*=1.22;\
				i4+=time*.001+v;\
			}\
			float v2=sin(uv.y*uv.x);\
			gl_FragColor = vec4(hsv2rgb(vec3(hue+v,1.,v2+(v-.5)*2.)),0.);\
		}\
		void stars(vec2 uv,float v){\
			uv = uv *2.0-1.0;\
			float s = 0.0, vv = 0.0;\
			float offset = (time*.0003);\
			vec3 col = vec3(0);\
			vec3 init = vec3(sin(offset * .002)*.3, .35 + cos(offset * .005)*.3, offset * 0.2);\
			for (int r = 0; r < 34; r++) {\
				vec3 p = init + s * vec3(uv, 0.05);\
				p.z = fract(p.z);\
				for (int i=0; i < 10; i++)\
					p = abs(p * 2.1) / dot(p, p) - .9;\
				vv += pow(dot(p, p), .9) * .06;\
				col +=  vec3(vv * 0.2+.4, 12.-s*2., .1 + vv * 1.) * vv * 0.00003;\
				s += .025;\
			}\
			gl_FragColor = vec4(clamp(col, 0.0, 1.0), 0.0);\
		}\
		void main() {\
			vec2 uv=gl_FragCoord.xy/resolution.xy;\
			vec2 p=(gl_FragCoord.xy*2.-resolution)/resolution;\
			float a=atan(p.y,p.x);\
			float d=length(p);\
			float v;\
			if(mode==0)\
				v=texture2D(textureCur,vec2(uv.x,0.)).x;\
			else\
				v=texture2D(textureCur,vec2((d+1.)*.5,0.)).x;\
			if(type==0)\
				dots(uv,v);\
			else if(type==1)\
				smoke(uv,v);\
			else\
				stars(uv,v);\
		}";
	this.audioctx=param.audioctx;
	this.wavedat=param.wavedat;
	this.freqdat=param.freqdat;
	this.dest=param.dest;
	this.senddest=param.senddest;

	param.w=512;
	param.h=512;

	this.w=param.w;
	this.h=param.h;

	this.wavimgdat=document.createElement("canvas").getContext("2d").createImageData(512,1);
	this.elem=document.createElement("canvas");
	this.elem.width=this.w;
	this.elem.height=this.h;

	this.sizex=param.w;
	this.sizey=param.h;

	var gl = this.elem.getContext("webgl") || this.elem.getContext("experimental-webgl");
	this.v_shader=gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(this.v_shader, vj_vs);
	gl.compileShader(this.v_shader);
	this.f_shaderscr=gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(this.f_shaderscr,vj_fs);
	gl.compileShader(this.f_shaderscr);
	if(!gl.getShaderParameter(this.v_shader, gl.COMPILE_STATUS))
		alert(gl.getShaderInfoLog(this.v_shader));
	if(!gl.getShaderParameter(this.f_shaderscr, gl.COMPILE_STATUS))
		alert(gl.getShaderInfoLog(this.f_shaderscr));

	this.prgscr = gl.createProgram();
	gl.attachShader(this.prgscr, this.v_shader);
	gl.attachShader(this.prgscr, this.f_shaderscr);
	gl.linkProgram(this.prgscr);

	var vPosition=gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER,vPosition);
	gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,1,0, 1,1,0, -1,-1,0, 1,-1,0]),gl.STATIC_DRAW);
	var vAttLocation = gl.getAttribLocation(this.prgscr, "position");
	gl.enableVertexAttribArray(vAttLocation);
	gl.vertexAttribPointer(vAttLocation, 3, gl.FLOAT, false, 0, 0);
	var texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1024, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

	var uniLocation = {};
	uniLocation.scr_time = gl.getUniformLocation(this.prgscr,"time");
	uniLocation.scr_resolution = gl.getUniformLocation(this.prgscr,"resolution");
	uniLocation.scr_cursor = gl.getUniformLocation(this.prgscr,"cursor");
	uniLocation.scr_texturecur = gl.getUniformLocation(this.prgscr,"textureCur");
	uniLocation.scr_type = gl.getUniformLocation(this.prgscr,"type");
	uniLocation.scr_mode = gl.getUniformLocation(this.prgscr,"mode");
	uniLocation.scr_hue = gl.getUniformLocation(this.prgscr,"hue");
	gl.activeTexture(gl.TEXTURE0);
	this.param = {
		"c":{"value":32,"type":"double","min":0,"max":100},
		"f":{"value":440,"type":"double","min":0,"max":1760},
		"v":{"value":0,"type":"double","min":0,"max":1},
		"q":{"value":5,"type":"double","min":0,"max":100},
		"hue":{"value":0,"type":"double","min":0,"max":1},
		"type":{"value":0,"type":"int","min":0,"max":1},
		"mode":{"value":0,"type":"int","min":0,"max":1},
		"scale":{"value":"cdega<cdega<c","type":"string"},
		"effk":{"value":0, "type":"int", "min":0, "max":3},
		"effv":{"value":1, "type":"double","min":0,"max":1},
		"effm":{"value":1, "type":"double","min":0,"max":1},
		"effz":{"value":0, "type":"double","min":0,"max":1},
		"effw":{"value":0, "type":"double","min":0,"max":1},
	};
	this.starttime=0;
	this.px=0;
	this.py=0;
	this.pz=0;

	this.anim=function(timestamp) {
		if(this.param.a.value==0)
			return;
		if(this.starttime==0)
			this.startime=timestamp;
		var dt=timestamp-this.lasttime;
		if(dt<50)
			return;
		this.lasttime=timestamp;

		for(var i=0;i<512;++i) {
	    var j=i<<2;
	    this.wavimgdat.data[j]=this.wavedat[i];
	    this.wavimgdat.data[j+3]=255;
	  }
		this.frameidx^=1;
		gl.useProgram(this.prgscr);
		gl.uniform1f(uniLocation.scr_time,timestamp-this.starttime);
		gl.uniform2fv(uniLocation.scr_resolution,[this.w,this.h]);
		gl.uniform3fv(uniLocation.scr_cursor,[this.px,this.py,this.pz]);
		gl.uniform1i(uniLocation.scr_texturecur,0);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.wavimgdat);
		gl.uniform1i(uniLocation.scr_type,this.param.type.value);
		gl.uniform1i(uniLocation.scr_mode,this.param.mode.value);
	  gl.uniform1f(uniLocation.scr_hue,this.param.hue.value);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0,4);
		gl.flush();
	};
};
