angular.module('starter.controllers', [])
    .controller('HeaderCtrl', ['$scope', '$rootScope', '$log', '$timeout', '$location', 'appServices', function ($scope, $rootScope, $log, $timeout, $location, appServices) {
        var scanCounter = 0,
            prevPassages = localStorage.getItem('prevPassages');
        prevPassages = JSON.parse(prevPassages);

        $rootScope.cardNum = "";

        $scope.scan = function () {
            if (scanCounter === 0) {
                var scp = angular.element('.izi-account').scope();
                if (scp && scp.reset) scp.reset();
                if (scp && scp.register) {
                    scp.reset();
                    scp.register = false;
                }

                var promise = appServices.scanBarcode();
                promise.then(
                    function (result) {
                        if (result.error == false) {
                            if (result.result.text) {
                                $rootScope.cardNum = result.result.text.replace(/.+\//, '');
                                var scp = angular.element('.izi-account').scope();
                                scp.client.barcode = $rootScope.cardNum;
                                prevPassages.push({card: $rootScope.cardNum, date: new Date()});
                                localStorage.setItem('prevPassages', JSON.stringify(prevPassages));
                                $scope.$apply(function () {
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
)
    .controller('OfflineCtrl', ['$scope', '$http', '$log', '$timeout', function ($scope, $http, $log, $timeout) {
        var connectedRef = "https://izigenerator.firebaseio.com/.info/connected";
        var isOffline = false;
        var poll = function () {
            $timeout(function () {
                $http.get(connectedRef).then(function (data) {
                    $('#offline-alert').fadeOut();
                    if (isOffline) {
                        isOffline = false;
                        $('#online-alert').fadeIn();
                        $timeout(function () {
                            $('#online-alert').fadeOut();
                        }, 3000);
                    }
                    poll();
                }).catch(function (err) {
                    $('#offline-alert').fadeIn();
                    isOffline = true;
                    poll();
                });
            }, 2500);
        };

        $http.get(connectedRef).then(function (data) {
            $('#offline-alert').fadeOut();
            poll();
        }).catch(function (err) {
            $('#offline-alert').fadeIn();
            poll();
        });
    }]
);