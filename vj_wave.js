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
vj_wave=function(param) {
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
	this.ctx.lineJoin="round";
	this.lasttime=0;
	this.anim=function(timestamp) {
		if(timestamp-this.lasttime<50)
			return;
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

		this.ctx.strokeStyle=this.param.col.value;
		this.ctx.fillStyle=this.param.col.value;
		this.ctx.lineWidth=this.param.line.value;
		this.ctx.shadowBlur=this.param.effb.value;
		this.ctx.shadowColor=this.param.bcol.value;
		this.ctx.beginPath();
		if(this.param.type.value==2) {
			var hh=this.h*.5;
			var hw=this.w*.5;
			var n=this.wavedat.length;
			for(var i=0;i<this.w;i+=2) {
				var v=0.2+(this.wavedat[(n*i/this.w)|0]-128)*.005;
				var px=hw*Math.sin(Math.PI*2*i/this.w)*v+hw;
				var py=hh*Math.cos(Math.PI*2*i/this.w)*v+hh;
				if(i==0)
					this.ctx.moveTo(px,py);
				this.ctx.lineTo(px,py);
			}
			if((this.ph+=0.1)>=2*Math.PI)
				this.ph-=2*Math.PI;
			this.ctx.closePath();
		}
		else if(this.param.type.value==1) {
			var hh=this.h*.75;
			var n=this.freqdat.length;
			this.ctx.moveTo(0,hh);
			for(var i=0;i<this.w;i+=2)
				this.ctx.lineTo(i,hh-this.freqdat[(n*.5*i/this.w)|0]*this.h/512);
			this.ctx.lineTo(this.w,hh);
		}
		else {
			var hh=this.h*.5;
			var n=this.wavedat.length;
			this.ctx.moveTo(0,hh);
			for(var i=0;i<this.w;i+=2)
				this.ctx.lineTo(i,hh-(this.wavedat[(n*i/this.w)|0]-128)*this.h/512);
			this.ctx.lineTo(this.w,hh);
		}
		if(this.param.fill.value)
			this.ctx.fill();
		this.ctx.stroke();
	};
	this.param={
		"line":{"value":2,		"type":"double",	"min":1,	"max":20},
		"type":{"value":0,		"type":"int",		"min":0,	"max":2},
		"fill":{"value":0,		"type":"int",		"min":0,	"max":1},
		"effb":{"value":0,		"type":"double",	"min":0,	"max":20},
		"effr":{"value":0.9,	"type":"double",	"min":0.9,	"max":0.99},
		"effx":{"value":0,		"type":"double",	"min":-20,	"max":20},
		"effy":{"value":0,		"type":"double",	"min":-20,	"max":20},
		"effz":{"value":1,		"type":"double",	"min":0.5,	"max":2},
		"col":{"value":"#f00",	"type":"string"},
		"bcol":{"value":"#fff",	"type":"string"},
	};
}
