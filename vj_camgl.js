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

vj_cam = function(param){
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
		uniform float effposter;\
		uniform float effmotion;\
		uniform int effkaleido;\
		uniform float effmosaic;\
		uniform float effwave;\
		uniform float effdiv;\
		uniform float effhue;\
		uniform float effsat;\
		uniform float effcont;\
		uniform int effpointer;\
		uniform float effmelt;\
		uniform float efffilm;\
		uniform float effunsync;\
		uniform float effscan;\
		float rand(vec2 p){\
			return fract(sin(dot(p ,vec2(12.9898,78.233))) * 43758.5453);\
		}\
		float smooth(float a, float b, float x){\
			float f=(1.-cos(x*3.14159))*.5;\
			return a+(b-a)*f;\
		}\
		float smoothrand(vec2 p){\
			vec2 i = floor(p);\
			vec2 f = fract(p);\
			vec4 v = vec4(rand(i),rand(vec2(i.x+1., i.y)),rand(vec2(i.x,i.y+1.)),rand(vec2(i.x+1.,i.y+1.)));\
			return smooth(smooth(v.x, v.y, f.x), smooth(v.z, v.w, f.x), f.y);\
		}\
		vec3 rgb2hsv(vec3 c){\
			vec4 K = vec4(0., -1./3., 2./3., -1.0);\
			vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));\
			vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));\
			float d = q.x - min(q.w, q.y);\
			float e = 1.0e-10;\
			return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);\
		}\
		vec3 hsv2rgb(vec3 c){\
			vec4 K = vec4(1., 2./3., 1./3., 3.);\
			vec3 p = abs(fract(c.xxx + K.xyz) * 6. - K.www);\
			return c.z * mix(K.xxx, clamp(p - K.xxx, 0., 1.), c.y);\
		}\
		vec2 trans(vec2 p){\
			float t=atan(p.y, p.x)+time*0.0001;\
			float r=length(p);\
			return vec2(t,r);\
		}\
		vec2 melt(vec2 p){\
			return p+(vec2(smoothrand(p*30.),smoothrand(p*31.))-vec2(.5))*effmelt;\
		}\
		void main() {\
			vec2 uv=gl_FragCoord.xy/resolution.xy;\
			vec2 p=abs(trans(uv));\
			float r=cursor.z*0.08+0.01;\
			float dist=min(1.0,length(cursor.xy-uv));\
			float th=atan((cursor.y-uv.y)/(cursor.x-uv.x));\
			float fac=pow(1.02-(dist-r),20.0);\
			float cr=fac*pow(abs(sin(th*4.0+time/100.0)),2.0*dist/r);\
			if(effpointer<1)\
				cr=0.;\
			float mos=resolution.x/(effmosaic*64.0+1.0);\
			uv=vec2(1.0)-uv;\
			if(effkaleido>=1) {\
				if(uv.x>0.5)\
					uv.x=1.0-uv.x;\
				if(effkaleido>=2) {\
					if(uv.y>0.5)\
						uv.y=1.0-uv.y;\
					if(effkaleido>=3)\
						if(uv.y>uv.x) {\
							float t=uv.x;\
							uv.x=uv.y;\
							uv.y=t;\
						}\
				}\
			}\
			uv.x+=sin(uv.y*50.0+time*.005)*effwave*0.05;\
			uv=fract(uv*floor(1.5+effdiv));\
			vec2 uv2=uv=floor(uv*mos)/mos;\
			float n1=max(0.,smoothrand(uv*12.+sin(floor(time*.024))*1231.21)-.95)*50.;\
			float n2=pow(smoothrand(uv.xx*42.+floor(time*.01)*12.),20.);\
			uv=uv+(vec2(smoothrand(uv*20.-time*.0011),smoothrand(uv*21.+time*.001))-vec2(.5))*effmelt*.1;\
			uv.y=mod(uv.y+(time/6000.)*effunsync,1.1);\
			vec4 colCur,colDiff;\
			if(uv.y>=1.0){\
				colCur=colDiff=vec4(0.);\
			}\
			else{\
				colCur=texture2D(textureCur,uv);\
				colDiff=texture2D(textureDiff,uv);\
			}\
			float v=colDiff.x;\
			colCur*=(sin(uv.y*525.)*effscan+1.);\
			vec3 hsv=rgb2hsv(colCur.xyz);\
			hsv.z-=(n1+n2)*efffilm;\
			hsv.x+=effhue;\
			hsv.y*=effsat;\
			hsv.z=(hsv.z-.5)*(effcont+1.)+.5;\
			colCur=vec4(hsv2rgb(hsv),colCur.w);\
			float poststep=max(2.,12.-effposter*10.);\
			if(effposter<=0.01) poststep=256.;\
			colCur=floor(colCur*poststep)/poststep;\
			if(v>0.75) {\
				colCur.x+=(1.0-colCur.x)*effmotion;\
				colCur.y+=(1.0-colCur.y)*effmotion;\
				colCur.z+=(1.0-colCur.z)*(v-0.75)*4.0*effmotion;\
			}\
			else if(v>0.5) {\
				colCur.x+=(1.0-colCur.x)*effmotion;\
				colCur.y+=(1.0-colCur.y)*(v-0.5)*4.0*effmotion;\
			}\
			else if(v>0.25) {\
				colCur.x+=(1.0-colCur.x)*(v-0.25)*4.0*effmotion;\
			}\
			gl_FragColor=vec4(colCur.x+cr*0.5,colCur.y+cr,colCur.z,1.0);\
		}";
	this.createVideoTexture=function(video) {
		var tex=gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D,tex);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,video);
		gl.bindTexture(gl.TEXTURE_2D,null);
		return tex;
	};
	this.updateTexture=function(video) {
		var t=this.texturePre;
		this.texturePre=this.textureCur;
		this.textureCur=t;
		gl.bindTexture(gl.TEXTURE_2D,this.textureCur);
		gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,video);
		gl.bindTexture(gl.TEXTURE_2D,null);
	};
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

	param.w=1024;
	param.h=1024;

	this.w=param.w;
	this.h=param.h;

	this.video=param.video;
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
	uniLocation.scr_poster = gl.getUniformLocation(this.prgscr,"effposter");
	uniLocation.scr_motion = gl.getUniformLocation(this.prgscr,"effmotion");
	uniLocation.scr_kaleido = gl.getUniformLocation(this.prgscr,"effkaleido");
	uniLocation.scr_pointer = gl.getUniformLocation(this.prgscr,"effpointer");
	uniLocation.scr_mosaic = gl.getUniformLocation(this.prgscr,"effmosaic");
	uniLocation.scr_wave = gl.getUniformLocation(this.prgscr,"effwave");
	uniLocation.scr_div = gl.getUniformLocation(this.prgscr,"effdiv");
	uniLocation.scr_hue = gl.getUniformLocation(this.prgscr,"effhue");
	uniLocation.scr_sat = gl.getUniformLocation(this.prgscr,"effsat");
	uniLocation.scr_cont = gl.getUniformLocation(this.prgscr,"effcont");
	uniLocation.scr_film = gl.getUniformLocation(this.prgscr,"efffilm");
	uniLocation.scr_melt = gl.getUniformLocation(this.prgscr,"effmelt");
	uniLocation.scr_unsync = gl.getUniformLocation(this.prgscr,"effunsync");
	uniLocation.scr_scan = gl.getUniformLocation(this.prgscr,"effscan");
	gl.activeTexture(gl.TEXTURE0);
	this.textureCur=this.createVideoTexture(this.video);
	this.texturePre=this.createVideoTexture(this.video);
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
		"effkaleido":{"value":0, "type":"int", "min":0, "max":3},
		"effpointer":{"value":0, "type":"int", "min":0, "max":3},
		"effposter":{"value":0, "type":"double","min":0,"max":1},
		"effmotion":{"value":1, "type":"double","min":0,"max":1},
		"effmosaic":{"value":0, "type":"double","min":0,"max":1},
		"effwave":{"value":0, "type":"double","min":0,"max":1},
		"effdiv":{"value":0, "type":"double","min":0, "max":1},
		"effhue":{"value":0, "type":"double","min":-4, "max":4},
		"effsat":{"value":1, "type":"double","min":0, "max":1},
		"effcont":{"value":0, "type":"double","min":0, "max":1},
		"effmelt":{"value":0, "type":"double","min":0, "max":1},
		"efffilm":{"value":0, "type":"double","min":0, "max":1},
		"effunsync":{"value":0, "type":"double","min":0, "max":1},
		"effscan":{"value":0, "type":"double","min":0, "max":1},
	};
	this.starttime=0;
	this.px=0;
	this.py=0;
	this.pz=0;

	this.Osc=this.audioctx.createOscillator();
	this.Fil=this.audioctx.createBiquadFilter();
	this.Lfo=this.audioctx.createOscillator();
	this.LfoGain=this.audioctx.createGain();
	this.Gain=this.audioctx.createGain();
	this.Send=this.audioctx.createGain();
	this.Send.gain.value=0;
	this.Gain.gain.value=0;
	this.Osc.connect(this.Fil);
	this.Lfo.connect(this.LfoGain);
	this.LfoGain.connect(this.Osc.detune);
	this.Fil.connect(this.Gain);
	this.Gain.connect(this.Send);
	this.Gain.connect(this.dest);
	this.Send.connect(this.senddest);
	this.midi=0;
	this.midipitch=0;
	this.Osc.type="square";
	this.Lfo.type="sine";
	this.Osc.frequency.value=440;
	this.Lfo.frequency.value=6;
	this.Fil.frequency.value=4400;
	this.Fil.Q.value=1;
	this.LfoGain.gain.value=0;
	this.Lfo.start(0);
	this.Osc.start(0);
	this.midion=0;
	this.midi=0;
	this.midipitch=0;
	this.notes=Mml(this.param.scale.value);

	this.anim=function(timestamp) {
		if(this.starttime==0)
			this.startime=timestamp;
		var dt=timestamp-this.lasttime;
		if(dt<12)
			return;
		this.lasttime=timestamp;
		this.frameidx^=1;
		this.updateTexture(this.video);
		gl.useProgram(this.prgdiff);
		gl.bindFramebuffer(gl.FRAMEBUFFER,this.framebuf[this.frameidx].f);
		gl.uniform2fv(uniLocation.diff_resolution,[this.sizex,this.sizey]);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.textureCur);
		gl.uniform1i(uniLocation.diff_texturecur,0);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, this.texturePre);
		gl.uniform1i(uniLocation.diff_texturepre,1);
		gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_2D, this.framebuf[this.frameidx^1].t);
		gl.uniform1i(uniLocation.diff_texturediff,2);
		gl.drawArrays(gl.TRIANGLE_STRIP,0,4);

		gl.readPixels(0,this.sizey-1,this.sizex,1,gl.RGBA,gl.UNSIGNED_BYTE,this.levx);
		gl.readPixels(this.sizex-1,0,1,this.sizey,gl.RGBA,gl.UNSIGNED_BYTE,this.levy);
		var avex=0,avey=0;
		for(var i=0;i<this.sizex;++i)
			avex+=this.levx[i*4+1];
		for(var i=0;i<this.sizey;++i)
			avey+=this.levy[i*4+2];
		avex/=this.sizex;
		avey/=this.sizey;
		var	px=0,py=0,sumpx=0,sumpy=0;
		for(var i=0;i<this.sizex;++i) {
			var j=i*4+1;
			if(this.levx[j]>avex) {
				var d=this.levx[j]-avex;
				px+=i*d;
				sumpx+=d;
			}
		}
		for(var i=0;i<this.sizey;++i){
			var j=i*4+1;
			if(this.levy[j+1]>avey) {
				var d=this.levy[j+1]-avey;
				py+=i*d;
				sumpy+=d;
			}
		}
		if(sumpx)
			px/=sumpx;
		if(sumpy)
			py/=sumpy;
		this.px=this.px*0.8+(1-px/this.sizex)*0.2;
		this.py=this.py*0.8+(1-py/this.sizey)*0.2;
		var vol=Math.min(1,sumpx*0.0002);
		vol=vol*vol;
		if(vol>0)
			this.pz=this.pz*0.8+vol*0.2;
//		console.log(this.px,this.py,this.pz);

		gl.bindFramebuffer(gl.FRAMEBUFFER,null);
		gl.useProgram(this.prgscr);
		gl.uniform1f(uniLocation.scr_time,timestamp-this.starttime);
		gl.uniform2fv(uniLocation.scr_resolution,[this.w,this.h]);
		gl.uniform3fv(uniLocation.scr_cursor,[this.px,this.py,this.pz]);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.textureCur);
		gl.uniform1i(uniLocation.scr_texturecur,0);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, this.framebuf[this.frameidx].t);
		gl.uniform1i(uniLocation.scr_texturediff,1);
		gl.uniform1f(uniLocation.scr_poster,this.param.effposter.value);
		gl.uniform1f(uniLocation.scr_motion,this.param.effmotion.value);
		gl.uniform1i(uniLocation.scr_kaleido,this.param.effkaleido.value);
		gl.uniform1i(uniLocation.scr_pointer,this.param.effpointer.value);
		gl.uniform1f(uniLocation.scr_mosaic,this.param.effmosaic.value);
		gl.uniform1f(uniLocation.scr_wave,this.param.effwave.value);
		gl.uniform1f(uniLocation.scr_div,this.param.effdiv.value);
		gl.uniform1f(uniLocation.scr_hue,this.param.effhue.value);
		gl.uniform1f(uniLocation.scr_sat,this.param.effsat.value);
		gl.uniform1f(uniLocation.scr_cont,this.param.effcont.value);
		gl.uniform1f(uniLocation.scr_melt,this.param.effmelt.value);
		gl.uniform1f(uniLocation.scr_film,this.param.efffilm.value);
		gl.uniform1f(uniLocation.scr_unsync,this.param.effunsync.value);
		gl.uniform1f(uniLocation.scr_scan,this.param.effscan.value);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0,4);
		gl.flush();
		var c=(this.notes[((this.sizex-1-px)*this.notes.length/this.sizex)|0]-57)*100;
		if(this.param.midi.value>0) {
			this.Gain.gain.value=this.Send.gain.value=0;
			var midiout=midioutputs[this.param.midi.value-1];
			if(midiout) {
				if(this.param.midi.value!=this.midi) {
					midiout.send([0xb0,70,125]);	//detune
					midiout.send([0xb0,76,55]);		//lfo rate
					midiout.send([0xb0,101,0]);
					midiout.send([0xb0,100,0]);
					midiout.send([0xb0,6,12]);
					midiout.send([0xb0,38,0]);		//RPN0 BendRange
					midiout.send([0xc0,17]);
					this.midi=this.param.midi.value;
				}
				this.midipitch+=(c-this.midipitch)*(1-this.param.porta.value);
//					var vol=(this.pos.z*this.param.v.value*127)|0;
				var vol=(this.pos.z*127)|0;
				if(vol>1) {
					if(this.midion==0)
						midiout.send([0x90,69,127]);
					this.midion=1;
				}
				else {
					if(this.midion)
						midiout.send([0x90,69,0]);
					this.midion=0;
				}

				midiout.send([0xb0,7,vol]);
//					midiout.send([0x90,69,127]);
				var p=((this.midipitch/1200*8191)|0)+8192;
				midiout.send([0xe0,p&0x7f,(p>>7)&0x7f]);
				var m=1-this.pos.y;
				midiout.send([0xb0,70,0]);//detune
				midiout.send([0xb0,80,32]);//cutoff
				midiout.send([0xb0,1,(m*16)|0]);
			}
		}
		{
			var f=Math.pow(this.param.c.value,this.py*1.4);
			this.Osc.frequency.value=this.param.f.value;
			this.Osc.detune.setTargetAtTime(c,0,this.param.porta.value*.1);
			this.Fil.frequency.value=this.param.f.value*f;
			this.Fil.Q.value=this.param.q.value;
			this.LfoGain.gain.value=f*1.2;
			this.Gain.gain.value=this.pz*this.param.v.value;
			this.Send.gain.value=this.param.delay.value;
		}

	};
};
