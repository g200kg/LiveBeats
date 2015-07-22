// vj_txt.js : vj command line text display
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
vj_cam=function(param) {
	this.w=param.w;
	this.h=param.h;
	this.yheight=(this.h*.8)|0;
	this.txt=param.txt;
	this.wavedat=param.wavedat;
	this.freqdat=param.freqdat;
	this.audioctx=param.audioctx;
	this.dest=param.dest;
	this.senddest=param.senddest;
	this.video=param.video;
	this.elem=document.createElement("canvas");
	this.resox=320;
	this.resoy=240;
	this.resox2=(this.resox/2)|0;
	this.resoy2=(this.resoy/2)|0;
	this.elem.width=this.resox;
	this.elem.height=this.resoy;
	this.ctx=this.elem.getContext("2d");
	this.cvwork=document.createElement("canvas");
	this.cvwork.width=this.resox;
	this.cvwork.height=this.resoy;
	this.ctxwork=this.cvwork.getContext("2d");
	this.imgdatframe=[2];
	this.imgdatcam=this.ctx.createImageData(this.resox,this.resoy);
	this.imgdatcamwork=this.ctx.createImageData(this.resox,this.resoy);
	this.frame=0;
	this.scrdiff=new Array(this.resox*this.resoy);
	this.levx=new Array(320);
	this.levy=new Array(240);
	this.pos={"x":0,"y":0,"z":0};
	for(var i=this.resox*this.resoy-1;i>=0;--i)
		this.scrdiff[i]=0;
	this.lasttime=0;
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
	this.anim=function(timestamp) {
		var dt=timestamp-this.lasttime;
		if(dt<50)
			return;
		var erase=Math.pow(0.999,dt);
		this.lasttime=timestamp;
		this.ctxwork.drawImage(this.video,0,0,this.resox,this.resoy);
		this.imgdatframe[this.frame&1]=this.ctxwork.getImageData(0,0,this.resox,this.resoy);
		if(this.frame>=1) {
			this.notes=Mml(this.param.scale.value);
			var f=this.frame&1;
			var cpix=this.imgdatframe[f].data;
			var opix=this.imgdatframe[1-f].data;
			var wpix=this.imgdatcamwork.data;
			var dpix=this.imgdatcam.data;
			var t=this.param.effv.value;
			var k=this.param.effk.value;
			var l=1-this.param.effl.value;
			var m=this.param.effm.value;
			var m64=m/64;
			var a=this.param.effa.value*255;
			var x,y,px,py,sx,py,i,r,g,b,cr,cg,cb;
			var avex=0,avey=0;
			var sumpx=0,sumpy=0;
			var cntpx=0;
			var resox=this.resox,resoy=this.resoy;
			var resox2=this.resox2,resoy2=this.resoy2;
			for(i=0;i<resox;++i)
				this.levx[i]=0;
			for(i=0;i<resoy;++i)
				this.levy[i]=0;
			for(y=0;y<resoy;++y) {
				var p=y*this.resox;
				var p4=p<<2,rp4=(p+this.resox-1)<<2;
				for(x=0;x<resox;++x,++p,p4+=4,rp4-=4) {
					cr=cpix[rp4];
					cg=cpix[rp4+1];
					cb=cpix[rp4+2];
					var diff=Math.min(255,(Math.abs(cr-opix[rp4])+Math.abs(cg-opix[rp4+1])+Math.abs(cb-opix[rp4+2])));
					var v=Math.max(this.scrdiff[p]*erase,diff);
					this.scrdiff[p]=v;
					this.levx[x]+=v;
					this.levy[y]+=v;
					r=cr*t;
					g=cg*t;
					b=cb*t+((cg>128)?255:0)*(1-t);
					if(v>=192) {
						r+=(255-r)*m;
						g+=(255-g)*m;
						b+=(255-b)*(v-192)*m64;
					}
					else if(v>=128) {
						r+=(255-r)*m;
						g+=(255-g)*(v-128)*m64;
					}
					else if(v>=64)
						r+=(255-r)*(v-64)*m64;
					if(y&2) {
						r*=l;
						g*=l;
						b*=l;
					}
					wpix[p4]=r;
					wpix[p4+1]=g;
					wpix[p4+2]=b;
					wpix[p4+3]=Math.max(v,a);
				}
			}
			for(y=0;y<this.resoy;++y) {
				var dp=y*this.resox*4;
				var sp=0;
				for(x=0;x<this.resox;++x,dp+=4) {
					var cx=x-this.resox2;
					var cy=y-this.resoy2;
					switch(k) {
					case 1:
						sp=((cy+this.resoy2)*this.resox+Math.abs(cx)+this.resox2)*4;
						break;
					case 2:
						sp=((Math.abs(cy)+this.resoy2)*this.resox+Math.abs(cx)+this.resox2)*4;
						break;
					case 3:
					case 4:
						sx=Math.abs(cx);
						sy=Math.abs(cy);
						if(sy>=sx) {
							var t=sx;
							sx=sy;sy=t;
						}
						sp=((sy+this.resoy2)*this.resox+sx+this.resox2)*4;
						break;
					case 0:
					default:
						sp=dp;
						break;
					}
					dpix[dp]=wpix[sp];
					dpix[dp+1]=wpix[sp+1];
					dpix[dp+2]=wpix[sp+2];
					dpix[dp+3]=wpix[sp+3];
				}
			}
			for(x=0;x<resox;++x)
				avex+=this.levx[x];
			avex/=resox;
			for(y=0;y<resoy;++y)
				avey+=this.levy[y];
			avey/=resoy;
			px=py=0;
			for(x=0;x<resox;++x) {
				if(this.levx[x]>avex) {
					var d=this.levx[x]-avex;
					px+=x*d;
					sumpx+=d;
					++cntpx;
				}
			}
			if(sumpx)
				px/=sumpx;
			sumpx/=cntpx;
			for(y=0;y<resoy;++y) {
				if(this.levy[y]>avey) {
					var d=this.levy[y]-avey;
					py+=y*d;
					sumpy+=d;
				}
			}
			if(sumpy)
				py/=sumpy;
			var vol=Math.min(1,sumpx*0.0002);
			vol=vol*vol;
			if(vol>0)
				this.pos.z=this.pos.z*0.8+vol*0.2;
			this.pos.x=px/resox;
			this.pos.y=py/resoy;
			var r=(this.pos.z*15+5);
			var grad=this.ctx.createRadialGradient(px|0,(py-r/4)|0,1,px|0,py|0,r|0);
			grad.addColorStop(0,"#fff");
			grad.addColorStop(0.4,"#ff0");
			grad.addColorStop(0.6,"#aa0");
			grad.addColorStop(1,"#000");
			this.ctx.putImageData(this.imgdatcam,0,0);
			this.ctx.fillStyle=grad;
			this.ctx.beginPath();
			this.ctx.arc(px,py,r,0,360,0);
			this.ctx.fill();
			var c=(this.notes[(px*this.notes.length/resox)|0]-57)*100;
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
				var f=Math.pow(this.param.c.value,1-this.pos.y);
				this.Osc.frequency.value=this.param.f.value;
				this.Osc.detune.setTargetAtTime(c,0,this.param.porta.value*.1);
				this.Fil.frequency.value=this.param.f.value*f;
				this.Fil.Q.value=this.param.q.value;
				this.LfoGain.gain.value=f*2;
				this.Gain.gain.value=this.pos.z*this.param.v.value;
				this.Send.gain.value=this.param.delay.value;
			}
		}
		++this.frame;
	};
	this.param={
	"c":{"value":32,"type":"double","min":0,"max":100},
	"f":{"value":440,"type":"double","min":0,"max":1760},
	"v":{"value":0,"type":"double","min":0,"max":1},
	"q":{"value":5,"type":"double","min":0,"max":100},
	"porta":{"value":0.5,"type":"double","min":0,"max":1},
	"delay":{"value":0,"type":"double","min":0,"max":1},
	"midi":{"value":0,"type":"int","min":0,"max":1},
	"col":{"value":"#0f0","type":"string"},
	"effa":{"value":1,"type":"double","min":0,"max":1},
	"effv":{"value":0,"type":"double","min":0,"max":1},
	"effl":{"value":0,"type":"double","min":0,"max":1},
	"effm":{"value":1,"type":"double","min":0,"max":1},
	"effk":{"value":0,"type":"int","min":0,"max":3},
	"scale":{"value":"cdega<cdega<c","type":"string"},
	};
}
