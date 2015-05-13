angular.module('starter.controllers', [])

    .controller('HeaderCtrl', ['$scope', '$log', '$timeout', 'appServices', function ($scope, $log, $timeout, appServices) {
        var scanCounter = 0;
        $scope.scan = function () {
            if (scanCounter === 0) {
                alert('scan launching!');
                var promise = appServices.scanBarcode();
                promise.then(
                    function (result) {
                        if (result.error == false) {
                            $log.info('Success: ' + result.text);
                        }
                        else {
                            $log.error('Error: ' + result);
                        }
                    }
                );

                $timeout(function() {
                    scanCounter = 0;
                }, 500)
            }
            scanCounter++;
        }
    }])

    .controller('DashCtrl', ['$scope', '$window', '$log', function ($scope, $window, $log) {
        $log.info('DashCtrl');
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
