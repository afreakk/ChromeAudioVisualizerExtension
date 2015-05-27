angular.module('AudioVisualizerOptions', ['ngRoute']);
angular.module('AudioVisualizerOptions').config(
	function($routeProvider) 
	{
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
function populateOptions($scope)
{
	storage.options.get(
		function(options)
		{
			repackedOptions=[];
			for(var key in options){
				var x = {};
				x.key = key
				x.value = options[key];
				repackedOptions.push(x);
			}
			$scope.options = repackedOptions;
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
angular.module('AudioVisualizerOptions').controller('optionsController',
	function($scope){
		populateOptions($scope);
		$scope.switchBoolean = function(index)
		{
			storage.options.setOption($scope.options[index].key,
				!$scope.options[index].value,
				function(){
					populateOptions($scope);
				}
			);
		};
		$scope.booleanLabel = function(value)
		{
			if(value)
				return "label label-success";
			return "label label-default";
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
	}
);
angular.module('AudioVisualizerOptions').filter('nmSvNm', 
	function() {
		return function(input) {
			return input.split(AV.strDelim)[1];
		};
	}
);
