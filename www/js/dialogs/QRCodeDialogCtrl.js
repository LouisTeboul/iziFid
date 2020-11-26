starterApp.config(function (dialogsProvider) {
    dialogsProvider.addDialog("QRCodeDialog",
        {
            controller: 'QRCodeDialogCtrl',
            templateUrl: 'templates/qrCodeDialog.html',
            parent: angular.element(document.body),
            clickOutsideToClose: false,
            fullscreen: true
        });
});

starterApp.controller('QRCodeDialogCtrl', function ($scope, $rootScope, $mdDialog, $timeout) {
    var video;

    $scope.value = "";

    $scope.init = function () {
        $timeout(function () {
            $('#reader').html5_qrcode(function (data) {
                localMediaStream.getTracks()[0].stop();
                $mdDialog.hide(data);
            },
                function (error) {
                    //show read errors 
                }, function (videoError) {
                    //the video stream could be opened
                }
            );
        }, 1);
    }

    $scope.ok = function () {

        try {
            if (localMediaStream) {
                localMediaStream.getTracks()[0].stop();
            }
        } catch (ex) {

        }

        $mdDialog.hide($scope.value);
    }

    $scope.cancel = function () {

        try {
            if (localMediaStream) {
                localMediaStream.getTracks()[0].stop();
            }
        } catch (ex) {

        }

        $mdDialog.cancel();
    }
});