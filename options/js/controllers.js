angular.module('AudioVisualizerOptions', ['ngRoute']);
angular.module('AudioVisualizerOptions').config(
	function($routeProvider) 
	{
		function appendScript(scriptPath){
			var script = document.createElement('script');
			script.setAttribute('src', scriptPath);
			document.head.appendChild(script);
		}
		AV.scripts.scenes.forEach(function(e){
				appendScript('../'+e);
		});
		$routeProvider
			.when('/sceneListing', 
			{
				templateUrl: 'sceneListing.html',
				controller: 'storageController',
			})
			.when('/optionsListing', 
			{
				templateUrl: 'optionsListing.html',
				controller: 'optionsController',
			})
			.when('/controlListing', 
			{
				templateUrl: 'controlListing.html',
			})
			.otherwise ({
				redirectTo: '/optionsListing'
			});
	}
);
function populateNameList($scope)
{
	storage.scenes.get(
		function(storageStuff)
		{
			$scope.sceneList = [];
			for(var nameKey in storageStuff)
			{
				var customScene = storageStuff[nameKey],
				listObj = {};
				listObj.name = nameKey;
				if('exception' in customScene)
					listObj.exception = customScene.exception;
				$scope.sceneList.push(listObj);
			}
			$scope.$apply();
		}
	);
}
angular.module('AudioVisualizerOptions').controller('storageController',
	function ($scope) {
		$scope.names = [];
		populateNameList($scope);
		$scope.deleteByName = function(name)
		{
			storage.scenes.remove(name,
				function()
				{
					populateNameList($scope);
				}
			);
		};
	}
);

function populateOptions($scope)
{
	storage.scenes.get(
		function(customScenes)
		{
			storage.options.get(
				function(options)
				{
					repackedOptions=[];
					for(var key in options){
						var x = {};
						x.key = key
						x.value = options[key];
						if(x.key ===  "startupScene"){
							x.dropDownValues = getAllSceneNames(customScenes).concat('Random');
							x.type = "dropdown";
						}
						else if(x.key ===  "LatencyHint"){
							x.dropDownValues = ['playback', 'balanced', 'interactive'];
							x.type = "dropdown";
						}
						else
							x.type = typeof x.value;
						repackedOptions.push(x);
					}
					$scope.options = repackedOptions;
					$scope.$apply();
				}
			);
		}
	);
}
angular.module('AudioVisualizerOptions').controller('optionsController',
	function($scope){
		populateOptions($scope);
		$scope.toggleBoolean = function(index)
		{
			storage.options.setOption($scope.options[index].key,
				!$scope.options[index].value,
				function(){
					populateOptions($scope);
				}
			);
		};
		$scope.updateInt = function(index)
		{
			storage.options.setOption($scope.options[index].key,
				parseInt($scope.options[index].value),
				function(){
					populateOptions($scope);
				}
			);
		};
		$scope.updateStr = function(index)
		{
			storage.options.setOption($scope.options[index].key,
				$scope.options[index].value,
				function(){
					populateOptions($scope);
				}
			);
		};
		$scope.setDefaultValue = function(index, callback)
		{
			var dValue = storage.options
				.defaultValues[ $scope.options[index].key ];
			storage.options.setOption($scope.options[index].key,
				dValue, function(){
					if(callback)
						callback();
					else
						populateOptions($scope);
				}
			);
		};
		$scope.setFactory = function(i)
		{
			if(!i)
				i=0;
			$scope.setDefaultValue(i, function(){
					i++;
					if(i == $scope.options.length)
						populateOptions($scope);
					else
						$scope.setFactory(i)
				}
			);
		};
		$scope.booleanLabel = function(value)
		{
			if(value)
				return "btn btn-success";
			return "btn btn-danger";
		};
	}
);
angular.module('AudioVisualizerOptions').controller('mainController',
	function($scope, $location){
		$scope.btnClass = function (url) {
			if(url === $location.path())
				return "label label-primary";
			return "label label-default";
		};
		$scope.avVersion = chrome.runtime.getManifest().version;
	}
);
angular.module('AudioVisualizerOptions').filter('nmSvNm', 
	function() {
		return function(input) {
			return input.split(AV.strDelim)[1];
		};
	}
);
