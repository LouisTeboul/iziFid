// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'fid.controllers', 'fid.services', 'ngMaterial', 'firebase', 'APIServiceApp', 'barcodeScanner'])

    .run(function ($ionicPlatform) {
        $ionicPlatform.ready(function () {
//            if (window.StatusBar) {
//                // org.apache.cordova.statusbar required
//                StatusBar.styleLightContent();
//            }
            if (!!navigator.splashscreen) {
                navigator.splashscreen.hide();
            }
        });
    })

    .config(function ($stateProvider, $urlRouterProvider, $mdThemingProvider, $ionicConfigProvider) {
        $mdThemingProvider.theme('default')
            .primaryPalette('green')
            .accentPalette('lime');

        $stateProvider

            // setup an abstract state for the tabs directive
            .state('fid', {
                url: "/fid",
                abstract: true,
                templateUrl: "templates/tab-widget.html"
            })

            // Each tab has its own nav history stack:
            .state('fid.main', {
                url: '/main',
                views: {
                    'tab-dash': {
                        templateUrl: 'templates/tab-widget.html',
                        controller: 'DashCtrl'
                    }
                }
            });

        $urlRouterProvider.otherwise('/fid/main');
    }
);
