function datUpdate(datElement)
{
	for (var i=0; i<datElement.__controllers.length; i++)
		datElement.__controllers[i].updateDisplay();
}
var DatFolder = function(guiElement)
{
	this.folder = guiElement;
	this.settings = [];
	this.childElements = [];
};
DatFolder.prototype.addSetting = function(variable, attribName)
{
	var elem = this.folder.add(variable, attribName);
	this.settings.push(elem);
	return elem;
};
DatFolder.prototype.reCheckChildElements = function()
{
	datUpdate(this.folder);
};

DatFolder.prototype.repopulate = function(settings, id)
{
    while(this.settings.length>0)
        this.folder.remove(this.settings.pop());
	var errors = [];
    for(var setting in settings)
	{
		try{
			if(	settings.hasOwnProperty(setting)
				&& setting != "exception")
				this.initSetting(setting, settings);
		}
		catch(e){
			errors.push(setting+e.message);
			aError(e);
		}
	}
	return errors;
},
DatFolder.prototype.initSetting = function(setting, settings)
{
	aLog("adding gui setting: "+setting);
	var owner, attribName, availableValues;
	if(	settings[setting].length &&
		settings[setting].length == 3)
	{
		owner =	settings[setting][0] == "g.ctx" ? g.ctx:
				settings[setting][0],
		attribName = settings[setting][1],
		availableValues = settings[setting][2];
	}
	else
		owner = settings, attribName = setting;
	var elem = this.insertElement(owner, attribName, availableValues)
	if(setting == 'spectrumJumps')
		elem.step(1);
},
DatFolder.prototype.insertElement = function(owner, attrib, restrictValues)
{
	if(!(attrib in owner))
		throw new Error("Error: "+attrib+" doesnt exist.");	
	var folder = this.folder.add(owner, attrib, restrictValues);
	this.settings.push(folder);
	return folder;
};
var GUI = function(datGUI)
{
	this.folders = {};
	this.datGUI = datGUI;
};
GUI.prototype.appendFolder = function(folderName)
{
	var folder = new DatFolder(this.datGUI.addFolder(folderName));
	this.folders[folderName] = folder;
	return folder;
};
GUI.prototype.reCheckValuesInternally = function()
{
	datUpdate(this.datGUI);
	for(var key in this.folders)
		this.folders[key].reCheckChildElements()
};
GUI.prototype.repopulateSceneList = function()
{
	aLog("repopulating scenelist");
	if(this.listElement)
		this.datGUI.remove(this.listElement);
	this.listElement = this.datGUI.add(g.sceneSelector,
			"scene", g.sceneSelector.sceneNames);
};
GUI.prototype.repopulateFolder = function(settings, folderName)
{
	return this.folders[folderName].repopulate(settings);
};
