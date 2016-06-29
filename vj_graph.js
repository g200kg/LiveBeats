// vj_graph.js : vj plugin sample
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
vj_graph=function(param) {
	this.w=param.w;
	this.h=param.h;
	this.elem=document.createElement("canvas");
	this.elem.width=this.w;
	this.elem.height=this.h;
	this.ctx=this.elem.getContext("2d");
	this.ctx.lineJoin="round";
	this.lasttime=0;
	this.anim=function(timestamp) {
		if(timestamp-this.lasttime<50)
			return;
		this.lasttime=timestamp;
	this.param={
		"type":{"value":0,		"type":"double",	"min":1,	"max":20},
		"col":{"value":"#f00",	"type":"string"},
		"bcol":{"value":"#fff",	"type":"string"},
	};
}
