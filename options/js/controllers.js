angular.module('AudioVisualizerOptions', []);

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
angular.module('AudioVisualizerOptions').filter('nmSvNm', 
	function() {
		return function(input) {
			return input.split(AV.strDelim)[1];
		};
	}
);
