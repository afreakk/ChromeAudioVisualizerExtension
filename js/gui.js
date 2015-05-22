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
    this.settings.push(this.folder.add(variable, attribName));
};
DatFolder.prototype.reCheckChildElements = function()
{
	datUpdate(this.folder);
};

DatFolder.prototype.repopulate = function(settings)
{
    while(this.settings.length>0)
        this.folder.remove(this.settings.pop());
    for(var setting in settings)
	{
        if(settings.hasOwnProperty(setting))//no object default atrbz
		{
			aLog("adding gui setting: "+setting);
			if(setting == 'spectrumJumps')
				this.settings.push(this.folder.add(settings, setting).step(1));
			else if(settings[setting].length &&
				   settings[setting].length	== 3)
			{
				try{
				var owner = settings[setting][0],
				attribName = settings[setting][1],
				availableValues = settings[setting][2];
				this.settings.push(this.folder.add(owner, attribName, availableValues));
				}catch(e){console.log("xception in repopulate:"+e);}
			}
			else
				this.settings.push(this.folder.add(settings, setting));
		}
	}
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
	if(this.listElement)
		this.datGUI.remove(this.listElement);
	this.listElement = this.datGUI.add(g.sceneSelector,
			"scene", g.sceneSelector.sceneNames);
};
GUI.prototype.repopulateFolder = function(settings, folderName)
{
	this.folders[folderName].repopulate(settings);
};
