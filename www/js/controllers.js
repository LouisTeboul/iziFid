angular.module('fid.controllers', [])
    .controller('HeaderCtrl', ['$scope', '$rootScope', '$log', '$timeout', '$location', '$mdDialog', 'barcodeService', function ($scope, $rootScope, $log, $timeout, $location, $mdDialog, barcodeService) {
        var scanCounter = 0,
            prevPassages = localStorage.getItem('prevPassages');
        prevPassages = JSON.parse(prevPassages);

        $rootScope.cardNum = "";

        var context = new AudioContext;
        var vco = context.createOscillator();
        vco.frequency.value = 450;
        vco.type = 'sine';
        vco.start(0);

        // Voltage Controlled Amplifier
        var vca = context.createGain();
        vca.gain.value = 0;
        // Connect the VCO to the VCA so we can modulate the volume of the beep
        vco.connect(vca);

        // Connect the VCA to the destination (= the speakers)
        vca.connect(context.destination);

        $scope.showScanDialog = function (ev) {
            $mdDialog.show({
                controller: DialogController,
                clickOutsideToClose: true,
                templateUrl: 'templates/scan-dialog.html',
                parent: angular.element(document.body),
                targetEvent: ev
            }).then(function (answer) {

            }, function () {

            });
        };

        function DialogController($scope, $mdDialog) {
            $scope.hide = function () {
                $mdDialog.hide();
            };
            $scope.cancel = function () {
                $mdDialog.cancel();
            };
            $scope.answer = function (answer) {
                $mdDialog.hide(answer);
            };
        }

        $scope.scan = function ($event) {
            if (window.device) {
                if (scanCounter === 0) {
                    var promise = barcodeService.scanBarcode();
                    promise.then(
                        function (result) {
                            $log.info('RESULT: ', result);
                            if (result.error == false) {
                                if (result.result.text) {
                                    $scope.$apply(function () {
                                        $scope.form.barcode = result.result.text.replace(/.+\//, '');
                                        $rootScope.cardNum = result.result.text.replace(/.+\//, '');
                                    });

                                    prevPassages.push({card: $rootScope.cardNum, date: new Date()});
                                    localStorage.setItem('prevPassages', JSON.stringify(prevPassages));
                                    var barcodeField = $('[name=barcodeId]');
                                    barcodeField.val("");
                                    barcodeField.val($rootScope.cardNum);
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
            } else {
                $scope.showScanDialog($event);
                $timeout(function() {
                    $('#videoSource').remove();
                    $('#reader').html5_qrcode(function (data) {
                        return $scope.processQr(data);
                    }, function (error) {
                        return $log.info('Error', error);
                    }, function (videoError) {
                        $log.info('VideoError', videoError);
                        if (videoError.name === "DevicesNotFoundError") {
                            return $log.error("ERREUR: Veuillez vérifier qu'une caméra est connectée à cet appareil !");
                        }
                    });
                }, 1000);
            }
        };

        $scope.processQr = function (data) {
            var cardNum;
            $mdDialog.hide();
            cardNum = data.replace(/.+\//, '');
            $rootScope.cardNum = cardNum;
            $scope.$apply(function () {
                if ($scope.form) $scope.form.barcode = cardNum;
                else $scope.form = { barcode: cardNum };
                var barcodeField = $('input[name=barcodeId]');
                barcodeField.val("");
                barcodeField.val(cardNum);
            });

            var accountScope = angular.element('.izi-account').scope();
            accountScope.$apply(function() {
                accountScope.form = { barcode: cardNum };
                accountScope.barcode = cardNum;
                accountScope.login();
            });

            vca.gain.value = 1;
            $timeout(function () {
                vca.gain.value = 0;
                $scope.$apply(function () {
                    $('#reader').qrcode_stop();
                });
            }, 120);
        };

        $timeout(function () {
            $scope.scan();
        }, 500);

        $(window).on('orientationchange', function (event) {
            $('#reader').children().remove();
            $('#videoSource').remove();
            $('#reader').qrcode_stop();
            return $('#reader').html5_qrcode(function (data) {
                return $scope.processQr(data);
            }, function (error) {
                return $log.info('Error', error);
            }, function (videoError) {
                $log.info('VideoError', videoError);
                if (videoError.name === "DevicesNotFoundError") {
                    return $log.error("ERREUR: Veuillez vérifier qu'une caméra est connectée à cet appareil !");
                }
            });
        });

        $rootScope.scan = $scope.scan;
    }])

    .controller('DashCtrl', ['$scope', '$rootScope', '$window', '$log', function ($scope, $rootScope, $window, $log) {
        $log.info('DashCtrl');
        $scope.autoLogin = $rootScope.autoLogin;
    }]);
