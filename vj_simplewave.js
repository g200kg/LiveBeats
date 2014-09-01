// vj_simplewave.js : vj plugin sample
//
// Should define same name function as
// function(param)
//	param={
//		'w':elementWidth,
//		'h':elementHeight,
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
vj_simplewave=function(param) {
	this.w=param.w;
	this.h=param.h;
	this.wavedat=param.wavedat;
	this.freqdat=param.freqdat;
	this.elem=document.createElement("canvas");
	this.elem.width=this.w;
	this.elem.height=this.h;
	this.ctx=this.elem.getContext("2d");
	this.ctx.lineJoin="round";
	this.anim=function(timestamp) {
		this.ctx.strokeStyle=this.param.col.value;
		this.ctx.lineWidth=this.param.line.value;
		this.ctx.clearRect(0,0,this.w,this.h);
		this.ctx.beginPath();
		this.ctx.moveTo(0,this.h/2-(this.wavedat[0]-128)*this.h/512);
		for(var i=1,e=this.wavedat.length;i<e;i+=2) {
			var x=this.w*i/e;
			var y=this.h/2-(this.wavedat[i]-128)*this.h/512;
			this.ctx.lineTo(x,y);
		}
		this.ctx.stroke();
	};
	this.param={
	"line":{"value":3,"type":"double","min":1,"max":10},
	"col":{"value":"#f00","type":"string"},
	};
}
