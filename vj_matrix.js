// vj_simplewave.js : vj plugin sample
//
// Should define same name function as
// function(param)
//	param={
//		'w':elementWidth,
//		'h':elementHeight,
//		'n':numOfData,
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
vj_matrix=function(param) {
	this.w=param.w;
	this.h=param.h;
	this.wavedat=param.wavedat;
	this.freqdat=param.freqdat;
	this.elem=document.createElement("canvas");
	this.elem.width=this.w;
	this.elem.height=this.h;
	this.elemwork=document.createElement("canvas");
	this.elemwork.width=this.w;
	this.elemwork.height=this.h;
	this.ctx=this.elem.getContext("2d");
	this.ctxwork=this.elemwork.getContext("2d");
	this.mat=Array(64);
	for(var i=0;i<64;++i)
		this.mat[i]=-1;
	this.mrx=this.w/64;
	this.mry=this.h/48;
	this.lasttime=0;
	this.anim=function(timestamp) {
		if(this.lasttime==0)
			this.lasttime=timestamp;
		if(timestamp-this.lasttime<50) {
			return;
		}
		this.lasttime=timestamp;
		var rz=this.param.effz.value;
		var sx=(this.w*rz)|0;
		var sy=(this.h*rz)|0;
		var sxoff=((this.w-sx)*.5)|0+this.param.effx.value;
		var syoff=((this.h-sy)*.5)|0+this.param.effy.value;
		this.ctx.shadowBlur=0;
		this.ctxwork.clearRect(0,0,this.w,this.h);
		this.ctxwork.drawImage(this.elem,sxoff,syoff,sx,sy);
		this.ctx.clearRect(0,0,this.w,this.h);
		this.ctx.globalAlpha=this.param.effr.value;
		this.ctx.drawImage(this.elemwork,0,0,this.w,this.h);
		this.ctx.globalAlpha=1.0;
		var i=this.wavedat[0]>>2;
		if(this.mat[i]<0)
			this.mat[i]=0;
		this.ctx.fillStyle=this.param.col.value;
		this.ctx.shadowBlur=this.param.effb.value;
		this.ctx.shadowColor=this.param.bcol.value;
		this.ctx.strokeStyle="#000";
		this.ctx.font="bold "+this.mry+"px Courier,monospace";
		this.ctx.lineWidth=3;
		for(var i=0;i<64;++i) {
			if(this.mat[i]>=0) {
				this.ctx.strokeText(String.fromCharCode(0x21+(this.wavedat[i*2]&0x3f)),i*this.mrx,this.mat[i]*this.mry);
				this.ctx.fillText(String.fromCharCode(0x21+(this.wavedat[i*2]&0x3f)),i*this.mrx,this.mat[i]*this.mry);
				if((this.mat[i]+=1)>48)
					this.mat[i]=0;
			}
		}
	};
	this.param={
		"effb":{"value":0,		"type":"double",	"min":0,	"max":20},
		"effr":{"value":0.95,	"type":"double",	"min":0.9,	"max":0.99},
		"effx":{"value":0,		"type":"double",	"min":-20,	"max":20},
		"effy":{"value":0,		"type":"double",	"min":-20,	"max":20},
		"effz":{"value":1,		"type":"double",	"min":0.5,	"max":2},
		"col":{"value":"#0f0",	"type":"string"},
		"bcol":{"value":"#fff",	"type":"string"},
	};
}
