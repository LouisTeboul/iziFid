// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'ngMaterial', 'firebase', 'APIServiceApp'])

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

        $ionicConfigProvider.scrolling.jsScrolling(true);

        // Ionic uses AngularUI Router which uses the concept of states
        // Learn more here: https://github.com/angular-ui/ui-router
        // Set up the various states which the app can be in.
        // Each state's controller can be found in controllers.js
        $stateProvider

            // setup an abstract state for the tabs directive
            .state('tab', {
                url: "/tab",
                abstract: true,
                templateUrl: "templates/tabs.html"
            })

            // Each tab has its own nav history stack:
            .state('tab.dash', {
                url: '/dash',
                views: {
                    'tab-dash': {
                        templateUrl: 'templates/tab-widget.html',
                        controller: 'DashCtrl'
                    }
                }
            })

            .state('tab.chats', {
                url: '/chats',
                views: {
                    'tab-chats': {
                        templateUrl: 'templates/tab-history.html',
                        controller: 'ChatsCtrl'
                    }
                }
            })

            .state('tab.account', {
                url: '/account',
                views: {
                    'tab-account': {
                        templateUrl: 'templates/tab-settings.html',
                        controller: 'AccountCtrl'
                    }
                }
            });

        $urlRouterProvider.otherwise('/tab/dash');
    }
);
