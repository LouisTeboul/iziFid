angular.module('fid.controllers', [])
    .controller('HeaderCtrl', ['$scope', '$rootScope', '$log', '$timeout', '$location', 'barcodeService', function ($scope, $rootScope, $log, $timeout, $location, barcodeService) {
        var scanCounter = 0,
            prevPassages = localStorage.getItem('prevPassages');
        prevPassages = JSON.parse(prevPassages);

        $rootScope.cardNum = "";

        $scope.scan = function () {
            if (scanCounter === 0) {
                var promise = barcodeService.scanBarcode();
                promise.then(
                    function (result) {
                        if (result.error == false) {
                            if (result.result.text) {
                                alert('Carte n°' + result.result.text);

                                angular.element('.izi-account').scope().$apply(function () {
                                    angular.element('.izi-account').scope().barcode = $rootScope.cardNum;
                                    angular.element('.izi-account').scope().form = { barcode: $rootScope.cardNum };
                                });
                                angular.element('.izi-account').scope().login($rootScope.cardNum);
                            }
                        } else {
                            $log.warn('Erreur: ', result);
                        }
                    }, function (error) {
                        $log.warn('Erreur: ', error);
                    }
                );

                $timeout(function () {
                    scanCounter = 0;
                }, 2000)
            }
            scanCounter++;
        };

        $rootScope.scan = $scope.scan;
        $scope.scan();
    }])

    .controller('DashCtrl', ['$scope', '$rootScope', '$window', '$log', function ($scope, $rootScope, $window, $log) {
        $log.info('DashCtrl');
        $scope.autoLogin = $rootScope.autoLogin;
    }]);
