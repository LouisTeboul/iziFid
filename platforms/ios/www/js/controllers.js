angular.module('starter.controllers', [])
    .controller('HeaderCtrl', ['$scope', '$rootScope', '$log', '$timeout', '$location', 'appServices', function ($scope, $rootScope, $log, $timeout, $location, appServices) {
        var scanCounter = 0,
            prevPassages = localStorage.getItem('prevPassages');
        prevPassages = JSON.parse(prevPassages);

        $rootScope.cardNum = "";

        $scope.scan = function () {
            if (scanCounter === 0) {
                var promise = appServices.scanBarcode();
                promise.then(
                    function (result) {
                        if (result.error == false) {
                            if (result.result.text) {
                                $rootScope.cardNum = result.result.text.replace(/.+\//, '');
                                prevPassages.push({card: $rootScope.cardNum, date: new Date()});
                                localStorage.setItem('prevPassages', JSON.stringify(prevPassages));
                                $scope.$apply(function() {
                                    $('input[name=barcodeId]').val("");
                                    $('input[name=barcodeId]').val($rootScope.cardNum);
                                });
                            }
                        }
                        else {
                            $log.warn('Erreur: ' + result);
                        }
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
    }]
);