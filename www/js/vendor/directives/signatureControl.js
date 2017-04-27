starterApp.directive('signatureControl', function ($translate, $http, $rootScope, $window) {
	return {
		templateUrl: 'js/vendor/directives/views/_signatureControl.html',
		restrict: 'E',
		scope: {
			title: "@",
			model: "=?",
			documentlegal: "=?",
			customerfullname: "=?",
			confirmed: "=?",
			currentdate: "=?"
		},
		link: function ($scope, elem, attrs) {
		    var _signaturePad = undefined;

			setTimeout(function () {
				var canvas = document.getElementById("signatureCanvas");

				_signaturePad = new SignaturePad(canvas, {
					onEnd: function () {
						$scope.model = _signaturePad.toDataURL();
						$scope.$evalAsync();
					}
				});
				if ($scope.model) _signaturePad.fromDataURL($scope.model);
			}, 1000);

			$scope.clearSignature = function () {
				_signaturePad.clear();
				$scope.model = undefined;
				$scope.$evalAsync();
			};

			$scope.displaysignature = function () {

			    if ($scope.confirmed) {
			        $(".signature").show(); 
			        $(".signatureempty").hide();
			    }
			    else {
			        $(".signature").hide();
			        $(".signatureempty").show();
			    }
			};

			$scope.saveSignature = function () {
			    if ($scope.model) {
			        var data = _signaturePad.toDataURL($scope.model);

			        var obj = {
			            "customerId": $rootScope.CustomerId,
			            "base64string": data
			        };
			        $http.post($rootScope.clientUrl + "/Customer/SavePdfCustomerLegalDocument", JSON.stringify(obj)).success(function (data) {
			            customAlert($translate.instant("Le document a été enregistré"), "", function () {
			                $rootScope.backToLoginRoot();
			            });
			            return true;
			        }).error(function (e) {
			            vars.debug ? $log.error(e) : 0;
			            return false;
			        });
			    }
			    else {
			        customAlert($translate.instant("Veuillez signer le document"));
			    }
			};

			$scope.getDocument = function () {
			    $http.get($rootScope.clientUrl + "/Customer/HtmlCustomerLegalDocument?customerId=" + $rootScope.CustomerId).success(function (data) {
			        $("#documentlegal").html(data);
			        return true;
			    }).error(function (e) {
			        vars.debug ? $log.error(e) : 0;
			        return false;
			    });
			}

			function customAlert(newTitle, newText, callback) {
			    swal({
			        title: newTitle,
			        text: newText,
			        showCancelButton: false,
			        confirmButtonColor: $scope.customization ? $scope.customization.styling.mainColor : "#28A54C",
			        confirmButtonText: "OK",
			        closeOnCancel: false,
			        closeOnConfirm: true
			    }, callback);
			}
		}
	};
});