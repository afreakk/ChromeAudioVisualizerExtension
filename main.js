var canvas = document.createElement('canvas');
canvas.id = "lerret";
canvas.width = 1280;
canvas.height = 720;
canvas.style.zIndex = 2147483647;
canvas.style.position = "absolute";
canvas.style.top = "0px";
canvas.style.left = "0px";
canvas.style.border = "0px";

var ctx=canvas.getContext("2d");
ctx.rect(20,20,150,100);
ctx.fillStyle="red";
ctx.fill();
