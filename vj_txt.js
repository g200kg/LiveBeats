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
vj_txt=function(param) {
	this.w=param.w;
	this.h=param.h;
	this.yheight=(this.h*.8)|0;
	this.txt=param.txt;
	this.wavedat=param.wavedat;
	this.freqdat=param.freqdat;
	this.elem=document.createElement("canvas");
	this.elem.width=this.w;
	this.elem.height=this.h;
	this.ctx=this.elem.getContext("2d");
	this.ctx.lineJoin="round";
	this.rows=25;
	this.mry=(this.yheight/this.rows)|0;
	this.ctx.lineWidth=6;
	this.ctx.font="bold "+this.mry+"px Courier,monospace";
	this.mrx=this.ctx.measureText("M").width;
	this.anim=function(timestamp) {
		if(this.param.fill.value>=.5) {
			this.ctx.strokeStyle="#000";
			this.ctx.fillStyle=this.param.col.value;
		}
		else {
			this.ctx.strokeStyle=this.param.col.value;
			this.ctx.fillStyle="#000";
		}
		this.ctx.lineWidth=this.param.line.value;
		this.ctx.clearRect(0,0,this.w,this.h);
		var i;
		for(i=0;i<this.rows;++i) {
			var s=this.txt[i];
			if(!s)
				s="";
			this.ctx.strokeText(s,10,this.yheight-i*this.mry);
			this.ctx.fillText(s,10,this.yheight-i*this.mry);
		}
		if(tick&1) {
			var m=this.ctx.measureText(this.txt[0]);
			this.ctx.beginPath();
			this.ctx.rect(m.width+10,this.yheight-this.mry+4,this.mrx,this.mry);
			this.ctx.stroke();
			this.ctx.fillRect(m.width+10,this.yheight-this.mry+4,this.mrx,this.mry);
		}
	};
	this.param={
	"line":{"value":3,"type":"double","min":1,"max":10},
	"col":{"value":"#0f0","type":"string"},
	"fill":{"value":1,"type":"int","min":0,"max":1},
	};
}
