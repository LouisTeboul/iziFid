angular.module('starter.controllers', [])

    .controller('HeaderCtrl', ['$scope', '$log', '$cordovaBarcodeScanner', function ($scope, $log, $cordovaBarcodeScanner) {
        document.addEventListener("deviceready", function () {
            $scope.scan = function () {
                $log.info('scan');
                $cordovaBarcodeScanner
                    .scan()
                    .then(function (barcodeData) {
                        // Success! Barcode data is here
                    }, function (error) {
                        // An error occurred
                    });
            };

        }, false);
    }])

    .controller('DashCtrl', ['$scope', '$window', '$log', '$cordovaBarcodeScanner', function ($scope, $window, $log, $cordovaBarcodeScanner) {
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
