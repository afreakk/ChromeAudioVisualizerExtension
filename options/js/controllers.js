angular.module('AudioVisualizerOptions', []);

function populateNameList($scope)
{
	getScenes(
		function(storageStuff)
		{
			var i=0;
			$scope.names = [];
			for(var nameKey in storageStuff)
				$scope.names[i++] = nameKey;
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
			chrome.storage.sync.remove(name, function()
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
