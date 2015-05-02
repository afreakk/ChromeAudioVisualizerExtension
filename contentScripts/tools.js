function componentToHex(c) 
{
    var hex = Math.min(Math.round(c),255).toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) 
{
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
} 

function togglePause()
{
	console.log("toggling pause");
	g.pause = !g.pause;
	if(g.pause)
	{
		g.canvas.style.visibility = "hidden";
		g.canvas.style.pointerEvents = "none";
		g.datStyle.visibility = "hidden";
		g.stats.domElement.style.visibility = 'hidden';
	}
	else
	{
		g.canvas.style.visibility = "visible";
		g.canvas.style.pointerEvents = "auto";
		g.datStyle.visibility = "visible";
		g.stats.domElement.style.visibility = 'visible';
		g.sceneManager.update();
	}
}

function canvasResize()
{
	g.canvas.width = window.innerWidth;
	g.canvas.height = window.innerHeight;
	var top = window.scrollY.toString()+"px";
	var left = window.scrollX.toString()+"px";
	g.canvas.style.top = top;
	g.canvas.style.left = left;
	g.stats.domElement.style.top = top;
	g.stats.domElement.style.left = left;
}

var GUI = function(datGUI)
{
    this.gui = datGUI;
    this.guiElements = [];
};
GUI.prototype.refresh = function(elements)
{
    while(this.guiElements.length>0)
        this.gui.remove(this.guiElements.pop());
    for(var elem in elements)
        if(elements.hasOwnProperty(elem))
            this.guiElements.push(this.gui.add(elements, elem));
};
