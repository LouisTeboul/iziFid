// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
var starterApp = angular.module('starter', ['ionic', 'starter.services', 'ngMaterial', 'firebase','AccountApp', 'APIServiceApp']);

starterApp
    .run(function ($ionicPlatform, $rootScope) {
    	$rootScope.Version = "3.0.0.11";

        $ionicPlatform.ready(function () {
//            if (window.StatusBar) {
//                // org.apache.cordova.statusbar required
//                StatusBar.styleLightContent();
//            }
            if (!!navigator.splashscreen) {
                navigator.splashscreen.hide();
            }
        });

        $ionicPlatform.registerBackButtonAction(function (e) {
        	e.preventDefault();
        }, 1000);
    })

    /* TODO API-V2 */
    //.config(function ($stateProvider, $urlRouterProvider, $mdThemingProvider, $ionicConfigProvider, $httpProvider, $injector) {
    .config(function ($stateProvider, $urlRouterProvider, $mdThemingProvider, $ionicConfigProvider, $httpProvider) {
        $mdThemingProvider.theme('default')
            .primaryPalette('green')
            .accentPalette('lime');

        $ionicConfigProvider.scrolling.jsScrolling(true);

        /* TODO API-V2 */
    	// Auth custom content
        //$httpProvider.interceptors.push(function ($q, $rootScope, $injector) {
        //	return {
        //		request: function (config) {
        //			var apiService = $injector.get('APIService');
        //			var token = apiService.get.token();

        //			if (token) {
        //				config.headers['Authorization'] = 'bearer ' + token.access_token;
        //			}
        //			return $q.when(config);
        //		}

        //	};
        //});

        // Ionic uses AngularUI Router which uses the concept of states
        // Learn more here: https://github.com/angular-ui/ui-router
        // Set up the various states which the app can be in.
        // Each state's controller can be found in controllers.js
        $stateProvider

            // setup an abstract state for the tabs directive
            .state('app', {
                url: "/app",
                abstract: true,
                templateUrl: "templates/tabs.html"
            })

            // Each tab has its own nav history stack:
            .state('app.home', {
                url: '/home',
                views: {
                    'tab-dash': {
                        templateUrl: 'templates/tabs.html',
                        controller: 'DashCtrl'
                    }
                }
            });

        $urlRouterProvider.otherwise('/app/home');
    }
);
