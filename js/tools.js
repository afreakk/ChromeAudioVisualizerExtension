function componentToHex(c)
{
    var hex = Math.min(Math.round(c),255).toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b)
{
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function hasAnyBrokenValues(settings)
{
	for(var i in settings)
	{
		if(settings[i]===null||isNaN(settings[i]))
			return true;
	}
	return false;
}
function setFps(visible)
{
	if(!visible&&!g.stats.isHidden)
	{
		g.stats.domElement.style.visibility = 'hidden';
		g.stats.isHidden = true;
	}
	else if(visible&&g.stats.isHidden)
	{
		g.stats.domElement.style.visibility = 'visible';
		g.stats.isHidden = false;
	}
}
function deleteDomClass(className)
{
	deleteDom(document.body.getElementsByClassName(className));
}
function deleteDomById(id)
{
	deleteDom(document.getElementById(id));
}
function deleteDom(elemList)
{
	if(elemList)
	{
		if(elemList.length)
		{
			if(elemList.length>0)
				[].forEach.call(elemList,_deleteDom);
		}
		else
			_deleteDom(elemList);
	}
}
function _deleteDom(elem)
{
	if('length' in elem)
	{
		if(elem.length>0){
			aLog("peeling DOMList");
			deleteDom(elem);
			return
		}
	}
	else
	{
		aLog("==BEGIN== trying to remove element:");
		aLog(elem);
		var success = true;
		try
		{
			if('parent' in elem && 'removeChild' in elem.parent)
				elem.parent.removeChild(elem);
			else if('parentElement' in elem && 'removeChild' in elem.parentElement)
				elem.parentElement.removeChild(elem);
			else
				document.body.removeChild(elem);
		}
		catch(e)
		{
			aLog(e);
			success = false;
		}
		aLog("==END== "+ success?	"successfully removed element":
									"failed to remove element"
		);
	}
}
function getIncrementalString(origStr)
{
	var lenMinOne = origStr.length-1;
	var incremStr;
	if(isNaN(origStr[lenMinOne]))
		incremStr = origStr + "0";
	else
	{
		var y = parseInt(origStr[lenMinOne])+1;
		if(y>9)
			incremStr = origStr + "0";
		else
			incremStr = origStr.substring(0, lenMinOne)+y;
	}
	return incremStr;
}
