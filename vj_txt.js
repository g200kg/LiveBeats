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
	this.cmds=param.cmds;
	this.wavedat=param.wavedat;
	this.freqdat=param.freqdat;
	this.elem=document.createElement("canvas");
	this.elem.width=this.w;
	this.elem.height=this.h;
	this.ctx=this.elem.getContext("2d");
	this.ctx.lineJoin="round";
	this.rows=23;
	this.mry=(this.yheight/this.rows)|0;
	this.ctx.font="bold "+(this.mry-2)+"px Courier,monospace";
	this.mrx=this.ctx.measureText("M").width;
	this.starttime=this.lasttime=0;
	this.curcnt=0;
	this.anim=function(timestamp) {
		if(this.param.a.value==0)
			return;
		if(this.starttime==0)
			this.startime=timestamp;
		var dt=timestamp-this.lasttime;
		if(dt<50)
			return;
		this.lasttime=timestamp;
		if(this.cmds.dirty){
			this.ctx.globalCompositeOperation="source-over";
			this.cmds.dirty=0;
			this.ctx.strokeStyle="#000";
			this.ctx.fillStyle=this.param.col.value;
			this.ctx.lineWidth=3;
			this.ctx.clearRect(0,0,this.w,this.h);
			var i;
			for(i=0;i<this.rows;++i) {
				var s=this.cmds.log[i];
				if(!s)
					s="";
				this.ctx.strokeText(s,10,this.yheight-i*this.mry);
				this.ctx.fillText(s,10,this.yheight-i*this.mry);
			}
		}
		if(++this.curcnt>=3){
			this.curcnt=0;
			var m=this.ctx.measureText(this.cmds.log[0]).width|0;
			this.ctx.globalCompositeOperation="xor";
			this.ctx.fillRect(m+12,this.yheight-this.mry+4,this.mrx|0,this.mry);
		}
	};
	this.param={
		"a":{"value":1,"type":"double"},
		"col":{"value":"#0f0","type":"string"},
	};
}
