angular.module('starter.controllers', [])
    .controller('HeaderCtrl', ['$scope', '$rootScope', '$log', '$timeout', '$location', 'appServices', function ($scope, $rootScope, $log, $timeout, $location, appServices) {
        var scanCounter = 0;
        $rootScope.cardNum = "";
        window.$location = $location;

        $scope.scan = function () {
            if (scanCounter === 0) {
                var promise = appServices.scanBarcode();
                promise.then(
                    function (result) {
                        if (result.error == false) {
                            alert("Carte n° " + result.result.text);
                            $rootScope.cardNum = result.result.text.replace(/.+\//, '');
                            $scope.$apply(function() {
                                $('.ion-compose').click();
                            })
                        }
                        else {
                            alert('Erreur: ' + result.error);
                        }
                    }
                );

                $timeout(function () {
                    scanCounter = 0;
                }, 1200)
            }
            scanCounter++;
        }
    }])

    .controller('DashCtrl', ['$scope', '$rootScope', '$window', '$log', function ($scope, $rootScope, $window, $log) {
        $log.info('DashCtrl');
        $scope.cardNum = $rootScope.cardNum;
    }])

    .controller('ChatsCtrl', ['$scope', '$rootScope', function ($scope, $rootScope) {
        $scope.cardNum = $rootScope.cardNum;
    }])

    .controller('ChatDetailCtrl', function ($scope, $stateParams, Chats) {
        $scope.chat = Chats.get($stateParams.chatId);
    })

    .controller('AccountCtrl', function ($scope) {
        $scope.settings = {
            enableFriends: true
        };
    });
