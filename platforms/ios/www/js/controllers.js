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
                                $rootScope.cardNum = result.result.text.replace(/.+\//, '');
                                prevPassages.push({card: $rootScope.cardNum, date: new Date()});
                                localStorage.setItem('prevPassages', JSON.stringify(prevPassages));
                                $scope.$apply(function () {
                                    var barcodeField = $('input[name=barcodeId]');
                                    barcodeField.val("");
                                    barcodeField.val($rootScope.cardNum);
                                });
                                var accountScope = angular.element('.izi-account').scope();
                                accountScope.$apply(function () {
                                    accountScope.barcode = $rootScope.cardNum;
                                    accountScope.form = { barcode: $rootScope.cardNum };
                                    accountScope.login();
                                });
                            }
                        }
                        else {
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
