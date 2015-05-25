/* fug diz zhit
(function()
{
	var insertExample = function(example)
	{
		storage.options.get(
			function(storage)
			{
				var pkg = {};
				if(!("options" in storage))
				{
					var options =
					{
						"ExampleInserted": true
					};
					pkg["options"] = options;
					pkg["RoundSpectrum"+AV.strDelim+"Custom_example"] = example;
				}
				else
				{
					if(!storage.options["ExampleInserted"])
					{
						pkg["Custom_example"] = example;
					}
				}
				if(Object.keys(pkg).length>0)
					//storage.options.set(pkg);
					//chrome.storage.sync.set(pkg);             <-- lookzie
			}
		);
	},
	roundExample =
	{
		"colorStrength": 0.75,
		"colorOffset": 3.1,
		"spectrumJumps":4,
		"colorWidth":0,
		"musicColorInfluenceReducer":1,
		"innerWidth":110,
		"staticWidth":1.1,
		"musicHeightPower":0.01,
		"circleMax":289
	};
	chrome.runtime.onInstalled.addListener(
		function()
		{
			insertExample(roundExample);
		}
	);
})();
*/
