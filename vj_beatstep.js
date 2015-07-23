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
vj_beatstep=function(param) {
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

	var i;
	this.osc=[];
	this.gain=[];
	this.lfo=this.audioctx.createOscillator();
	this.lfo.frequency.value=5;
	this.lfogain=this.audioctx.createGain();
	this.filter=this.audioctx.createBiquadFilter();
	this.vol=this.audioctx.createGain();
	this.vol.gain.value=0.1;
	this.comp=this.audioctx.createDynamicsCompressor();
	this.filter.Q.value=12;
	this.filter.connect(this.vol);
	this.vol.connect(this.comp);
	this.comp.connect(this.audioctx.destination);
	this.lfo.connect(this.lfogain);
	this.lfo.start(0);
	this.note=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
	this.detuneoffset=[16,14,12,9,7,4,2,0, 28,26,24,21,19,16,14,12];
	this.filterval=64;
	this.vibval=0;
	this.volval=0.1;
	this.bpmval=140;
	this.bend=0;
	for(i=0;i<16;++i){
		this.osc[i]=this.audioctx.createOscillator();
		this.osc[i].type="sawtooth";
		this.osc[i].start(0);
		this.gain[i]=this.audioctx.createGain();
		this.gain[i].gain.value=0;
		this.osc[i].connect(this.gain[i]);
		this.gain[i].connect(this.filter);
		this.lfogain.connect(this.osc[i].detune);
		this.osc[i].frequency.value=440;
	}

	this.onmidimessage=function(e){
		switch(e.data[0]){
		case 0x90:
			var n=e.data[1]-36;
			if(n>=0&&n<16){
				this.note[n]=1;
				this.gain[n].gain.value=1;
			}
			break;
		case 0x80:
			var n=e.data[1]-36;
			if(n>=0&&n<16){
				this.note[n]=0;
				this.gain[n].gain.value=0;
			}
			break;
		case 0xa0:
	//		audioengine.lfogain.gain.value=200*Math.pow(e.data[2]/127,4);
			break;
		case 0xb0:
			switch(e.data[1]){
			case 7:
//			console.log(e.data);
				this.bend=(e.data[2]/127-0.5)*2;
				for(var i=0;i<16;++i)
					this.osc[i].detune.value=this.detuneoffset[i]*100+this.bend*1200*3;
				break;
			case 10:
				this.filterval=e.data[2]/127;
				this.filter.frequency.value=100*Math.pow(10000,this.filterval);
				break;
			case 72:
				this.volval=e.data[2]/127;
				this.vol.gain.value=this.volval;
				break;
			case 114:
				this.vibval=e.data[2]/127;
				this.lfogain.gain.value=Math.pow(2400,this.vibval);
				break;
			}
		}
	};
	this.anim=function(timestamp) {
		var width=this.resox*0.025;
		var x,y,th;
		this.ctx.clearRect(0,0,this.resox,this.resoy);
		th=-Math.PI*2*this.bend*2;
		x=this.resox2*Math.sin(th)*0.7;
		y=this.resoy2*Math.cos(th)*0.7;
		this.ctx.beginPath();
		this.ctx.moveTo(this.resox2,this.resoy2);
		this.ctx.lineTo(this.resox2+x,this.resoy2+y);
		this.ctx.strokeStyle="#c04";
		this.ctx.lineCap="round";
		this.ctx.lineWidth=10;
		this.ctx.stroke();

		this.ctx.fillStyle="#f8c";
		this.ctx.strokeStyle="#83f";
		this.ctx.lineWidth=width;
		this.ctx.beginPath();
		this.ctx.arc(this.resox2,this.resoy2,this.resox2*0.5,0,Math.PI*2);
		this.ctx.stroke();
		for(var i=0;i<8;++i){
			this.ctx.beginPath();
			th=Math.PI*2*i/8;
			x=this.resox2*Math.sin(th);
			y=this.resoy2*Math.cos(th);
			this.ctx.arc(this.resox2+x*0.5,this.resoy2+y*32/24*0.5,width+this.note[i]*width,0,Math.PI*2);
			this.ctx.arc(this.resox2+x*0.25,this.resoy2+y*32/24*0.25,width+this.note[i+8]*width,0,Math.PI*2);
			this.ctx.fill();
		}

		return;
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
