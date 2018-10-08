var GUI = function(datGUI){
	this.datGUIElem = datGUI,
	this.childHubs= {},
	this.settings= {};
};
GUI.prototype =  {
	addSetting: function(variable, attribName, restrictValues){
		var elem = this.datGUIElem.add(variable, attribName, restrictValues);
		this.settings[attribName] = elem;
		return elem;
	},
	removeSetting: function(setting){
		this.datGUIElem.remove(this.settings[setting]);
		delete this.settings[setting];
	},
	reCheckChildElements: function(){
		datUpdate(this.datGUIElem);
		for(var key in this.childHubs)
			this.childHubs[key].reCheckChildElements();
	},
	repopulate: function(settings, id){
		for(var oldSetting in this.settings){
			this.removeSetting(oldSetting);
		}
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
	initSetting: function(setting, settings)
	{
		if (setting === 'preset') {
			//hack, for hiding this
			return;
		}
		aLog("adding gui setting: "+setting);
		var owner, attribName, availableValues;
		if (settings[setting].availableValues) {
			owner = settings, attribName = settings[setting].attribName;
			availableValues = settings[setting].availableValues;
		}
		else if(settings[setting].length &&	settings[setting].length == 3)
		{
			owner =	settings[setting][0] == "g.ctx" ? g.ctx:
					settings[setting][0],
			attribName = settings[setting][1],
			availableValues = settings[setting][2];
		}
		else
			owner = settings, attribName = setting;
		if(!(attribName in owner))
			throw new Error("Error: "+attribName+" doesnt exist.");
		var elem = this.addSetting(owner, attribName, availableValues)
		if(setting == 'spectrumJumps')
			elem.step(1);
	},
	appendFolder: function(folderName){
		var folder = new GUI(this.datGUIElem.addFolder(folderName));
		this.childHubs[folderName] = folder;
		return folder;
	},
	repopulateFolder: function(settings, folderName){
		return this.childHubs[folderName].repopulate(settings);
	}
};
GUI.prototype.refreshSetting =  function(owner, attribName, restrictValues){
	if(attribName in this.settings)
		this.removeSetting(attribName);
	setting = this.addSetting(owner, attribName, restrictValues);
};

//utilz
function datUpdate(datElement)
{
	for (var i=0; i<datElement.__controllers.length; i++)
		datElement.__controllers[i].updateDisplay();
}
