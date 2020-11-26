starterApp.config(function (dialogsProvider) {
    dialogsProvider.addDialog("LoginDialog",
        {
            controller: 'LoginDialogCtrl',
            templateUrl: 'templates/loginDialog.html',
            parent: angular.element(document.body),
            clickOutsideToClose: false,
            fullscreen: true
        });
});

starterApp.controller('LoginDialogCtrl', function ($scope, $rootScope, $mdDialog, $timeout) {

    $scope.model = {
        login: undefined,
        password: undefined
    };

    $scope.init = function () {

    }

    $scope.ok = function () {
        $mdDialog.hide("{login:" + $scope.model.login + ",password:" + $scope.model.password+"}");
    }
});