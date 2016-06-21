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
		uniform float vu;\
		uniform float hue;\
		uniform float scale;\
		uniform float rot;\
		vec3 hsv2rgb(vec3 c){\
			vec4 K = vec4(1., 2./3., 1./3., 3.);\
			vec3 p = abs(fract(c.xxx + K.xyz) * 6. - K.www);\
			return c.z * mix(K.xxx, clamp(p - K.xxx, 0., 1.), c.y);\
		}\
		vec3 rgb2hsv(vec3 c){\
		    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);\
		    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));\
		    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));\
		    float d = q.x - min(q.w, q.y);\
		    float e = 1.0e-10;\
		    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);\
		}\
		vec3 hsl2rgb(vec3 c){\
			float v=c.z*2.;\
			float s=c.y;\
			if(v>1.){\
				s=mix(c.y,0.,v-1.);\
				v=1.;\
			}\
			return hsv2rgb(vec3(c.x,s,v));\
		}\
		void fold(inout vec2 p) {\
			if(p.x + p.y < 0.0) p.xy = -p.yx;\
		}\
		void rotate(inout vec2 p, float a) {\
			float s = sin(a);\
			float c = cos(a);\
			p = mat2(c, s, -s, c)*p;\
		}\
		float map(vec3 p) {\
			float d = 20.0;\
			for(int i = 0; i < 5; i++) {\
				rotate(p.xz, time*0.0003);\
				rotate(p.xy, time*0.00022);\
				fold(p.xy);\
				fold(p.xz);\
				fold(p.yz);\
				p=2.0*p-1.0;\
				vec3 p2=pow(abs(p),vec3(1.6));\
				float pp=pow(p2.x+p2.y+p2.z,1.0/1.6);\
				d=pp*pow(2.,-float(i));\
			}\
			return d;\
		}\
		float march(vec3 ro, vec3 rd, float v) {\
			float t = 1.0;\
			for(int i = 0; i <10; i++) {\
				float d = map(ro + rd*t);\
				if(t < 0.1 || t >= 8.0) \
					break;\
				t += d*(0.08 + .1*t);\
			}\
			return t;\
		}\
		void dots(vec2 p,float v){\
			p-=.5;\
		  p*=10.0;\
			p.y+=v*2.;\
		  float v2=-cos(p.x)*.25+(sin(p.y*4.*v*cos(time*.0003))*0.25+0.25);\
			gl_FragColor = vec4(hsl2rgb(vec3(hue,1.,v2)),0.);\
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
			col=rgb2hsv(clamp(col,0.,1.));\
			col.x+=hue;\
			col=hsv2rgb(col);\
			gl_FragColor = vec4(col, 0.0);\
		}\
		void rings(vec2 uv,float v){\
			uv-=0.5;\
			vec2 cursor=vec2(0.,0.);\
			vec2 p = uv;\
			vec2 m = vec2(v);\
			p /= dot(p,p);\
			float t = (cos(length(m-p) * v*15.) +cos(length(p)*15.+time*.005))* length(uv)*2.;\
			gl_FragColor = vec4(hsv2rgb(vec3(hue,1.,t)),0.);\
		}\
		void cells(vec2 uv,float v){\
			float t=v;\
			uv-=0.5;\
			vec3 p =vec3(uv*(sin(v)*4.+2.),time*.001);\
			t=length(.5-fract(p*=mat3(-2,-1,2, 3,-2,1, 1,2,2)*.5));\
			t=min(t,length(.5-fract(p*=mat3(-2,-1,2, 3,-2,1, 1,2,2)*.4)));\
			float t2=pow(.5+(t-.5)*2.,2.);\
			gl_FragColor = vec4(hsl2rgb(vec3(hue,1.,t2)),0.);\
		}\
		void lights(vec2 uv,float v){\
			uv.y*=resolution.y/resolution.x;\
			vec3 dir=vec3(uv*(1.900 * (0.5 + 0.5*cos(.001*time)) + 0.5),1.);\
			vec3 from=vec3(.5+.0005*time,.0005*time,-.0003*time*0.1)*2.5;\
			dir-=vec3(.001*time,.0015*time,-.00003*time);\
			float s=.4,fade=.2;\
			vec3 vv=vec3(0.);\
			vec3 p;\
			float a2=-3.1;\
			float a1=0.8;\
			float a3 = 0.063*time;\
			float a,pa;\
			mat2 rot1=mat2(cos(a1),sin(a1),-sin(a1),cos(a1));\
			mat2 rot2=mat2(cos(a2),sin(a2),-sin(a2),cos(a2));\
			dir.xz*=rot1;\
			dir.yz*=rot2;\
			from.xz*=rot1;\
			from.yz*=rot2;\
			for (int r=0; r<8; r++) {\
				p=from+s*dir*.5;\
				p = abs(vec3(0.85)-mod(p,vec3(1.7)));\
				pa=0.,a=0.;\
				for (int i=0; i<8; i++) {\
					p=abs(p)/dot(p,p)-.12;\
					a+=abs(length(p)-pa);\
					pa=length(p);\
				}\
				a*=a*a;\
				vv+=vec3(s)*a* (0.005 + 0.004*(sin(0.002*time))) *fade;\
				fade*=0.56;\
				s+=0.2;\
			}\
			vv=mix(vec3(length(vv)),vv,0.8);\
			float t=vv.x*.01;\
			gl_FragColor = vec4(hsl2rgb(vec3(hue+v,1.,t)),0.);\
		}\
		void plane(vec2 uv,float v){\
			vec2 p = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);\
			p=uv-.5;\
			p.y=abs(p.y);\
			float tt=1./p.y;\
			float t=p.x/p.y;\
			float vv=mod(t,1.);\
			float vvv=mod(tt+time*.001,1.);\
			vv=(vv*vvv*p.y)*2.;\
			gl_FragColor = vec4(hsl2rgb(vec3(hue+v,1.,vv)),0.);\
		}\
		void object(vec2 uv,float v){\
			uv-=0.5;\
			vec3 col=vec3(0.0);\
			vec3 ro = vec3(0, 0, -4);\
			vec3 rd = normalize(vec3(uv, .7));\
			float i = march(ro, rd, v-.5);\
			if(i < 4.0) {\
				vec3 pos = ro + rd*i;\
				vec2 h = vec2(0.001, 0.0);\
				vec3 n = vec3(\
					map(pos + h.xyy) - map(pos - h.xyy),\
					map(pos + h.yxy) - map(pos - h.yxy),\
					map(pos + h.yyx) - map(pos - h.yyx)\
				);\
				vec3 nor=normalize(n);\
				col += clamp(nor, 0.0, 1.0);\
			}\
			float tt=col.x+col.y;\
			gl_FragColor = vec4(hsl2rgb(vec3(hue,1.,tt)),0.);\
		}\
		void spot(vec2 uv,float v){\
			vec2 p = (uv-.5)*200.;\
			p*=0.3+v;\
			vec3 color = vec3(.0,.0,.0);\
			for(float i=0.;i<10.0;i+=1.0) {\
				float o=0.0;\
				for(float j=0.;j<100.0;j+=12.){\
					o += .005*i/(length(vec2(p.x-10.0*i*sin(time*j*.0001)*cos(time*.001)+10.0*i*cos(time*j*.00017)*cos(time*i*.0001), p.y-10.0*i*cos(time*j*.0001)+10.0*i*sin(time*j*.0001))));\
				}\
				color+=max(color,vec3(o*.1,o*0.9*cos(i),o*0.29*i));\
			}\
			color.x+=hue;\
			gl_FragColor = vec4(hsv2rgb(color),0.0);\
		}\
		void main() {\
			vec2 uv=(gl_FragCoord.xy/resolution.xy-.5);\
			vec2 p=(gl_FragCoord.xy*2.-resolution)/resolution;\
			float a=atan(p.y,p.x);\
			float d=length(p);\
			float v;\
			float th=atan(uv.y,uv.x)+rot;\
			float r=length(uv)/scale;\
			uv=vec2(cos(th)*r,sin(th)*r);\
			uv+=.5;\
			if(mode==0)\
				v=texture2D(textureCur,vec2(uv.x,0.)).x;\
			else if(mode==1)\
				v=texture2D(textureCur,vec2((d+1.)*.5,0.)).x;\
			else\
				v=vu;\
			if(type==0)\
				dots(uv,v);\
			else if(type==1)\
				smoke(uv,v);\
			else if(type==2)\
				stars(uv,v);\
			else if(type==3)\
				rings(uv,v);\
			else if(type==4)\
				cells(uv,v);\
			else if(type==5)\
				lights(uv,v);\
			else if(type==6)\
				plane(uv,v);\
			else if(type==7)\
				spot(uv,v);\
			else if(type==8)\
				object(uv,v);\
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
	uniLocation.scr_rot = gl.getUniformLocation(this.prgscr,"rot");
	uniLocation.scr_vu = gl.getUniformLocation(this.prgscr,"vu");
	uniLocation.scr_z = gl.getUniformLocation(this.prgscr,"scale");
	gl.activeTexture(gl.TEXTURE0);
	this.param = {
		"hue":{"value":0,"def":0,"type":"double","min":0,"max":1},
		"type":{"value":0,"def":0,"type":"int","min":0,"max":1},
		"mode":{"value":0,"def":0,"type":"int","min":0,"max":1},
		"rot":{"value":0,"def":0,"type":"double","min":0,"max":1},
		"z":{"value":1,"def":0, "type":"double","min":0,"max":100},
	};
	this.starttime=0;
	this.px=0;
	this.py=0;
	this.pz=0;
	this.vul=0;
	this.vu=0;

	this.anim=function(timestamp) {
		if(this.param.a.value==0)
			return;
		if(this.starttime==0)
			this.startime=timestamp;
		var dt=timestamp-this.lasttime;
		if(dt<50)
			return;
		this.lasttime=timestamp;
		var vu2=0;
		for(var i=1;i<512;++i) {
			var j=i<<2;
			this.wavimgdat.data[j]=this.wavedat[i];
			this.wavimgdat.data[j+3]=255;
			vu2+=Math.abs(this.wavedat[i]-128)/(128*512);
		}
		this.vul=this.vul*.8+(vu2*4.)*.2;
		var vu3=20*Math.log(this.vul);
		if(vu3<-40)
			vu3=-40;
		if(vu3>0)
			vu3=0;
		this.vu=(vu3+40)/40;
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
		gl.uniform1f(uniLocation.scr_rot,this.param.rot.value*6.28/360);
		gl.uniform1f(uniLocation.scr_vu,this.vu);
		gl.uniform1f(uniLocation.scr_z,this.param.z.value);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0,4);
		gl.flush();
	};
};
