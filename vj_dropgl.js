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
		uniform sampler2D textureCur;\
		uniform sampler2D textureDiff;\
		uniform float eff_solar;\
		uniform float eff_motion;\
		uniform int eff_kaleido;\
		uniform float eff_mosaic;\
		uniform float eff_wave;\
		float plasma(vec2 p,float v){\
		  p*=10.0;\
			p.y+=v*2.;\
		  return (sin(p.x)*0.25)+(sin(p.y*20.*sin(time*.0003))*0.25+0.25);\
		}\
		void main() {\
			vec2 uv=gl_FragCoord.xy/resolution.xy;\
			float r=cursor.z*0.08+0.01;\
			float dist=min(1.0,length(cursor.xy-uv));\
			float th=atan((cursor.y-uv.y)/(cursor.x-uv.x));\
			float fac=pow(1.02-(dist-r),20.0);\
			float cr=fac*pow(abs(sin(th*4.0+time/100.0)),2.0*dist/r);\
			float mos=resolution.x/(eff_mosaic*64.0+1.0);\
			vec2 pos = (gl_FragCoord.xy*2.0 -resolution) / resolution;\
			vec2 p=(gl_FragCoord.xy*2.-resolution)/resolution;\
			float v=texture2D(textureCur,vec2((p.x+1.)*.5,0.)).x;\
		  gl_FragColor = vec4(plasma(pos,v));\
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

	this.video=param.video;
	this.wavimgdat=document.createElement("canvas").getContext("2d").createImageData(512,1);
	this.elem=document.createElement("canvas");
	this.elem.width=this.w;
	this.elem.height=this.h;

	this.sizex=param.w;
	this.sizey=param.h;

	var gl = this.elem.getContext("webgl");
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
	uniLocation.scr_texturecur = gl.getUniformLocation(this.prgscr,"textureCur");
	uniLocation.scr_texturediff = gl.getUniformLocation(this.prgscr,"textureDiff");
	uniLocation.scr_solar = gl.getUniformLocation(this.prgscr,"eff_solar");
	uniLocation.scr_motion = gl.getUniformLocation(this.prgscr,"eff_motion");
	uniLocation.scr_kaleido = gl.getUniformLocation(this.prgscr,"eff_kaleido");
	uniLocation.scr_mosaic = gl.getUniformLocation(this.prgscr,"eff_mosaic");
	uniLocation.scr_wave = gl.getUniformLocation(this.prgscr,"eff_wave");
	gl.activeTexture(gl.TEXTURE0);
	this.levx=new Uint8Array(this.sizex*4);
	this.levy=new Uint8Array(this.sizey*4);
	this.param = {
		"c":{"value":32,"type":"double","min":0,"max":100},
		"f":{"value":440,"type":"double","min":0,"max":1760},
		"v":{"value":0,"type":"double","min":0,"max":1},
		"q":{"value":5,"type":"double","min":0,"max":100},
		"porta":{"value":0.5,"type":"double","min":0,"max":1},
		"delay":{"value":0.4,"type":"double","min":0,"max":1},
		"midi":{"value":0,"type":"int","min":0,"max":1},
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
	  gl.uniform1f(uniLocation.scr_solar,this.param.effv.value);
		gl.uniform1f(uniLocation.scr_motion,this.param.effm.value);
		gl.uniform1i(uniLocation.scr_kaleido,this.wavimgdat.data[0]);
		gl.uniform1f(uniLocation.scr_mosaic,this.param.effz.value);
		gl.uniform1f(uniLocation.scr_wave,this.wavimgdat.data[0]/255);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0,4);
		gl.flush();
	};
};
