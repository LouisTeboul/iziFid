angular.module('starter.controllers', [])
    .controller('HeaderCtrl', ['$scope', '$rootScope', '$log', '$timeout', '$location', 'appServices', function ($scope, $rootScope, $log, $timeout, $location, appServices) {
        var scanCounter = 0;
        $rootScope.cardNum = "";

        $scope.scan = function () {
            if (scanCounter === 0) {
                var promise = appServices.scanBarcode();
                promise.then(
                    function (result) {
                        if (result.error == false) {
                            alert("Carte n° " + result.result.text);
                            $rootScope.cardNum = result.result.text.replace(/.+\//, '');
                            $('input[name=barcodeId]').val($rootScope.cardNum);
                        }
                        else {
                            alert('Erreur: ' + result);
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
        $scope.autoLogin = $rootScope.autoLogin;
    }])

    .controller('ChatsCtrl', function ($scope, Chats) {
        $scope.chats = Chats.all();
        $scope.remove = function (chat) {
            Chats.remove(chat);
        }
    })

    .controller('ChatDetailCtrl', function ($scope, $stateParams, Chats) {
        $scope.chat = Chats.get($stateParams.chatId);
    })

    .controller('AccountCtrl', function ($scope) {
        $scope.settings = {
            enableFriends: true
        };
    });
