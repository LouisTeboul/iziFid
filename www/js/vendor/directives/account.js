"use strict";

angular.module('APIServiceApp')
    .directive('iziAccount', function () {
        return {
            restrict: "EA",
            replace: true,
            transclude: true,
            scope: {
                barcode: "@",
                clientUrl: "@",
                theme: "@",
                remoteCss: "@",
                otherModelValue: "=compareTo",
                firebase: "@",
                auto: "="
            },

            templateUrl: 'js/vendor/directives/views/account.html',
            link: function (scope) {
                if (scope.theme === 'light') {
                    angular.element('.izi-account').addClass('izi-light-theme');
                }
            },
            controller: [
                '$scope', '$rootScope', '$element', '$attrs', '$http', '$window', '$timeout', '$log', '$mdDialog', '$mdToast', '$animate', '$firebaseObject', 'APIService',
                function ($scope, $rootScope, $element, $attrs, $http, $window, $timeout, $log, $mdDialog, $mdToast, $animate, $firebaseObject, APIService) {

                    /** Initial setup */
                    APIService.set.clientUrl($scope.clientUrl);
                    $scope.isReady = false;

                    $timeout(function () {
                        if (!window.phonegap) {
                            !APIService.get.debugState() ?
                                $window.alert('The app is running in a browser, no UUID found!') :
                                $log.info('The app is running in a browser, no UUID found!');
                            $scope.isBrowser = true;
                        }
                    }, 0);

                    function onDeviceReady() {
                        if (window.device) {
                            $scope.isBrowser = false;
                            APIService.get.serverUrl(window.device.uuid, function (serverUrl) {
                                APIService.set.clientUrl(serverUrl);
                                $log.info(serverUrl);
                            });
                        }
                    }

                    document.addEventListener("deviceready", onDeviceReady, false);

                    if ($scope.remoteCss) {
                        /** Get css content and inject it into the <head> tag of the page this directive is included in */
                        var cssUrl = $scope.remoteCss || 'http://localhost:8001/remotecss.css';
                        $http.get(cssUrl).success(function (data) {
                            $scope.isReady = true;
                            angular.element(document).find('head').append("<style type='text/css'>" + data + "</style>");
                            angular.element('#izi-style').remove();
                        }).error(function (e) {
                            $scope.isReady = true;
                            $log.error(e);
                        });

                    } else if ($scope.firebase) {
                        var ref = new Firebase($scope.firebase); //jshint ignore:line

                        $scope.data = $firebaseObject(ref);

                        $scope.data.$loaded()
                            .then(function (data) {
                                $scope.isReady = true;
                                $scope.customization = data;
                                /** Get the customization data from firebase and build css style from it */
                                angular.element(document).find('head').append("<style type='text/css'>" +
                                    buildStyleFromData($scope.customization) +
                                    angular.element('#izi-style').html().replace(/#123456/g, $scope.customization.styling.mainColor).replace(/#654321/g, $scope.customization.styling.secondaryColor) + "</style>");
                                angular.element('#izi-style').remove();

                            })
                            .catch(function (error) {
                                console.error("Error:", error);
                            }
                        );
                    }

                    function stripNameOffGoogleFonts(gfontsUrl) {
                        return gfontsUrl.replace("http://fonts.googleapis.com/css?family=", "").replace(/:.+/, "").replace("+", " ");
                    }

                    function buildStyleFromData(data) {
                        var mainFontName = stripNameOffGoogleFonts(data.styling.mainFont);
                        var secondaryFontName = stripNameOffGoogleFonts(data.styling.secondaryFont);

                        return "@import url(" + data.styling.mainFont + ");" +
                            "@import url(" + data.styling.secondaryFont + ");" +
                            ".izi-account h1, .izi-account h2, .izi-account h3:not(.fid-item-title) { color: " + data.styling.mainColor + " !important; font-family:" + mainFontName + ", Helvetica, Arial, sans-serif !important; }" +
                            ".izi-account h4, .izi-account h5, .izi-account p, .izi-account a, .izi-account small, .izi-account div { color: " + data.styling.secondaryColor + " !important; font-family: " + secondaryFontName + ", Helvetica, Arial, sans-serif !important; }" +
                            ".izi-account a, .izi-account a:hover { color: " + data.styling.mainColor + " !important; }";
                    }

                    $scope.toastPosition = {
                        bottom: true,
                        top: false,
                        left: false,
                        right: true
                    };

                    /**
                     * @function $scope.getToastPosition Utility function for material toast
                     * @returns {string} The toast position
                     */
                    $scope.getToastPosition = function () {
                        return Object.keys($scope.toastPosition)
                            .filter(function (pos) {
                                return $scope.toastPosition[pos];
                            })
                            .join(' ');
                    };

                    /**
                     * @function toast Displays a toast with a message
                     * @param {string} message The message to display in the toast
                     */
                    $scope.toast = function (message) {
                        $mdToast.show(
                            $mdToast.simple()
                                .content(message)
                                .position($scope.getToastPosition())
                                .hideDelay(1500)
                        );
                    };

                    $scope.form = {};
                    $scope.QRCodeValid = true;
                    $scope.client = {};
                    var balanceInUse;

                    $attrs.$observe('barcode', function (passedBarcode) {
                        console.log(passedBarcode);
                        checkBarcode(passedBarcode);
                        $scope.barcodeValid ? displayData() : 0;
                    });

                    $scope.customStyle ? angular.element(document).find('head').prepend("<style type='text/css'>" + $scope.customStyle + "</style>") : 0;

                    /** If the barcode to check is valid we assign it to $scope.barcode, otherwise we delete $scope.barcode altogether */
                    function checkBarcode(barcode) {
                        ($scope.barcodeValid = !!(barcode && APIService.validate.barcode(barcode))) ? $scope.barcode = barcode : delete $scope.barcode;
                    }

                    function displayData() {
                        $scope.isReady = false;
                        /*if ($scope.isBrowser) {
                         APIService.get.loyaltyObjectWithPassword($scope.barcode, $scope.form.password, function (data) {
                         $scope.isReady = true;
                         $log.info(data);
                         if (!data.CustomerFirstName && !data.CustomerLastName && !data.CustomerEmail) {
                         $scope.reset();
                         $window.alert('Login ou Mot de passe erronné !');
                         } else {
                         $scope.data = data;
                         $scope.data.Offers = APIService.get.formattedOffers(data);
                         $scope.hideData = false;
                         }
                         });
                         } else {*/
                        APIService.get.loyaltyObject($scope.barcode, function (data) {
                            $log.info('loyalty object:', data);
                            $scope.isReady = true;
                            if (data === false) {
                                $scope.reset();
                                navigator.notification.alert('Carte inconnue !', null, "Ibis Kitchen", "OK");
//                                $window.alert('Carte inconnue !');
                                !$scope.isBrowser ? $rootScope.scan() : 0;
                            } else if (!data.CustomerFirstName && !data.CustomerLastName && !data.CustomerEmail) {
                                $scope.client.barcode = $scope.barcode;
                                $scope.reset();
                                if (data === "login error - #1003")
                                    $window.alert('Cette adresse email est déjà utilisée !');
                                $scope.goRegister();
                            } else {
                                $scope.data = data;
                                $scope.data.Offers = APIService.get.formattedOffers(data);
                                $scope.selectedAction = data.CustomActions[0].Id;
                                $scope.hideData = false;
                            }
                        });
//                        }
                    }

                    $scope.getDate = function (date) {
                        return new Date(date);
                    };

                    /** Disconnect function */
                    $scope.disconnect = function () {
                        if (navigator.notification) {
                            navigator.notification.confirm('Êtes-vous sûr de vouloir vous déconnecter ?', function () {
                                $scope.reset();
                            }, "Ibis Kitchen");
                        } else {
                            $window.confirm("Êtes-vous sûr de vouloir vous déconnecter ?") ? (function () {
                                $scope.reset();
                            })() : 0;
                        }
                    };

                    $scope.goRegister = function () {
                        $scope.register = true;
                    };

                    $scope.backToLogin = function () {
                        $scope.register = false;
                        $scope.reset();
                        window.scrollTo(0, 0);
                        !$scope.isBrowser ? $rootScope.scan() : 0;
                    };

                    $scope.login = function () {
                        checkBarcode($scope.form.barcode);
                        if (navigator.notification) {
                            $scope.barcodeValid ? displayData() : navigator.notification.alert("Ce n° de carte n'est pas valide !", null, "Ibis Kitchen", "OK");
                        } else {
                            $scope.barcodeValid ? displayData() : $window.alert("Ce n° de carte n'est pas valide !");
                        }
                    };

                    $scope.autoLogin = function () {
                        if ($scope.auto) {
                            checkBarcode($scope.form.barcode);
                            if (navigator.notification) {
                                $scope.barcodeValid ? displayData() : navigator.notification.alert("Ce n° de carte n'est pas valide !", null, "Ibis Kitchen", "OK");
                            } else {
                                $scope.barcodeValid ? displayData() : $window.alert("Ce n° de carte n'est pas valide !");
                            }
                        }
                    };

                    $scope.hideDialog = function () {
                        $mdDialog.hide();
                        $('md-backdrop, .md-dialog-container').remove(); //jshint ignore:line
                    };

                    $scope.reset = function () {
                        $scope.client = {barcode: $scope.form.barcode};
                        delete $scope.barcode;
                        delete $rootScope.cardNum;
                        delete $scope.form.barcode;
                        delete $scope.form.password;
                    };

                    $scope.addPassage = function () {
                        var passageObj = APIService.get.emptyPassageObj();
                        APIService.actions.addPassage(passageObj).success(function () {
                            $scope.hideDialog();
                            $scope.toast("Un passage a bien été ajouté à cette carte");
                            $scope.reset();
                            $timeout(function () {
                                !$scope.isBrowser ? $rootScope.scan() : 0;
                            }, 1600);
                            return true;
                        });
                    };

                    $scope.addOrder = function (amount) {
                        var passageObj = APIService.get.emptyPassageObj();
                        passageObj.barcode = $scope.barcode;
                        passageObj.OrderTotalIncludeTaxes = amount;
                        passageObj.OrderTotalExcludeTaxes = amount;
                        APIService.actions.addOrder(passageObj).success(function () {
//                            $scope.hideDialog();
                            $scope.toast("Le montant d'achat a bien été enregistré");
//                            $scope.reset();
//                            $timeout(function () {
//                                !$scope.isBrowser ? $rootScope.scan() : 0;
//                            }, 1600);
                            return true;
                        });
                    };

                    /**
                     * @function $scope.useBalanceToPay
                     * @param {number} val The amount of the balance to use for payment
                     * @param {object} balance The balance object to use */
                    $scope.useBalanceToPay = function (val, balance) {
                        $scope.hasUsedBalance = true;
                        var passageObj = APIService.get.emptyPassageObj();

                        if (~~balance.Value < ~~val) {
                            if (navigator.notification) {
                                $scope.barcodeValid ? displayData() : navigator.notification.alert('Ce montant est supérieur au total de la cagnotte', null, "Ibis Kitchen", "OK");
                            } else {
                                $scope.barcodeValid ? displayData() : $window.alert('Ce montant est supérieur au total de la cagnotte');
                            }
                            return false;
                        } else {
                            passageObj.BalanceUpdate = {
                                "Id": balance.Id,
                                "UpdateValue": -parseFloat(val)
                            };

                            $log.info('adding Passage...', JSON.stringify(passageObj));
                            APIService.actions.addPassage(passageObj).success(function () {
                                $mdDialog.hide();
                                $scope.hideDialog();
                                $scope.toast("Le paiement en avoir a bien été effectué");
                                $scope.reset();
                                $timeout(function () {
                                    $scope.hasUsedBalance = false;
                                    !$scope.isBrowser ? $rootScope.scan() : 0;
                                }, 1600);
                                return true;
                            });
                        }
                    };

                    $scope.useOffer = function (offer) {
                        var passageObj = APIService.get.emptyPassageObj();

                        passageObj.Offer = {
                            "OfferObjectId": offer.OfferObjectId,
                            "Barcode": offer.Barcode,
                            "Date": new Date() + ""
                        };

                        $log.info('using offer...', JSON.stringify(passageObj));
                        APIService.actions.addPassage(passageObj).success(function () {
                            $mdDialog.hide();
                            $scope.hideDialog();
                            $scope.toast("L'offre a bien été utilisée");
                            $scope.reset();
                            $timeout(function () {
                                !$scope.isBrowser ? $rootScope.scan() : 0;
                            }, 1600);
                            return true;
                        });
                    };

                    $scope.orderAmount = function (amount) {
                        if (amount) {
                            var passageObj = APIService.get.emptyPassageObj();
                            passageObj.OrderTotalIncludeTaxes = amount;
                            passageObj.OrderTotalExcludeTaxes = amount;
                            if ($scope.data.CustomActions) {
                                passageObj.CustomAction = {
                                    "CustomActionId": $('#actionSelect').val()
                                }
                            }
                            APIService.actions.addPassage(passageObj).success(function () {
                                $scope.hideDialog();
                                $scope.toast("Un passage a bien été ajouté à cette carte");
                                $scope.reset();
                                $timeout(function () {
                                    $rootScope.scan();
                                }, 1600);
                                return true;
                            });
                        }
                    };

                    $scope.submitRegister = function () {
                        var obj = {
                            Barcode: $scope.client.barcode,
                            FirstName: $scope.client.firstname,
                            LastName: $scope.client.lastname,
                            Email: $scope.client.email,
                            Phone: $scope.client.tel,
                            StreetAddress: $scope.client.address,
                            ZipPostalCode: $scope.client.zipcode,
                            City: $scope.client.city,
                            Password: $scope.client.password,
                            ConfirmPassword: $scope.client.passwordConfirm
                        };

                        APIService.actions.register(obj).then(function () {
                            $log.info('Retour API register ', obj);
                            $scope.barcode = $scope.client.barcode;
                            $scope.form.password = $scope.client.password;
                            $scope.register = false;
                            displayData();
                        });
                    };

                    $scope.useAction = function () {
                        if (navigator.notification) {
                            navigator.notification.alert("L'action a bien été effectuée", function () {
                                var passageObj = APIService.get.emptyPassageObj();
                                var amount = $('#orderAmountInput').val();
                                passageObj.OrderTotalIncludeTaxes = amount;
                                passageObj.OrderTotalExcludeTaxes = amount;
                                passageObj.CustomAction = {
                                    "CustomActionId": $('#actionSelect').val()
                                };
                                $log.info(passageObj);

                                APIService.actions.addPassage(passageObj).success(function () {
                                    $scope.hideDialog();
                                    $scope.toast("Un passage a bien été ajouté à cette carte");
                                    $scope.reset();
                                    $timeout(function () {
                                        !$scope.isBrowser ? $rootScope.scan() : 0;
                                    }, 1000);
                                    return true;
                                });
                                $scope.backToLogin();
                            });
                        } else {
                            alert("L'action a bien été effectuée :\n");
                            var passageObj = APIService.get.emptyPassageObj();
                            var amount = $('#orderAmountInput').val();
                            passageObj.OrderTotalIncludeTaxes = amount;
                            passageObj.OrderTotalExcludeTaxes = amount;
                            passageObj.CustomAction = {
                                "CustomActionId": $('#actionSelect').val()
                            };
                            $log.info(passageObj);

                            APIService.actions.addPassage(passageObj).success(function () {
                                $scope.hideDialog();
                                $scope.toast("Un passage a bien été ajouté à cette carte");
                                $scope.reset();
                                $timeout(function () {
                                    !$scope.isBrowser ? $rootScope.scan() : 0;
                                }, 1600);
                                return true;
                            });
                            $scope.backToLogin();
                        }
                    };

                    $scope.showConfirm = function (ev, offer) {
                        if (navigator.notification) {
                            navigator.notification.confirm('Voulez-vous utiliser cette offre ?', function () {
                                $scope.useOffer(offer);
                            }, "Ibis Kitchen");
                        } else {
                            var doUse = $window.confirm("Voulez-vous utiliser cette offre ?");
                            if (doUse) $scope.useOffer(offer);
                        }
//                        $scope.currentOffer = offer;
//                        $mdDialog.show({
//                            scope: $scope,
//                            preserveScope: true,
//                            clickOutsideToClose: true,
//                            targetEvent: ev,
//                            template: '<md-dialog aria-label="Utiliser Offre"> \
//                                <md-dialog-content class="sticky-container clearfix"> \
//                                    <md-subheader class="md-sticky-no-effect"><h3 style="margin-bottom: 0">Utiliser Cette Offre ?</h3></md-subheader> \
//                                    <p style="padding-left: 16px;">Confirmez-vous l\'utilisation de cette offre ?</p> \
//                                </md-dialog-content> \
//                                <div class="md-actions" layout="row"> \
//                                 <div class="clearfix">\
//                                    <md-button class="md-accent md-hue-3" ng-click="useOffer(currentOffer)"> \
//                                    VALIDER \
//                                    </md-button> \
//                                    <md-button class="md-warn" ng-click="hideDialog()"> \
//                                    ANNULER \
//                                    </md-button> \
//                                 </div> \
//                                </div> \
//                            </md-dialog>'
//                        }).then(function () {
//                        }, function () {
//                        });
                    };

                    $scope.showAddPassageConfirm = function (ev) {
                        if (navigator.notification) {
                            navigator.notification.confirm("Confirmez-vous que ce client est passé en caisse sans utiliser d'offre et/ou d'avoir fidélité ?", function () {
                                $scope.addPassage();
                            }, "Ibis Kitchen");
                        } else {
                            var doUse = $window.confirm("Confirmez-vous que ce client est passé en caisse sans utiliser d'offre et/ou d'avoir fidélité ?");
                            if (doUse) $scope.addPassage();
                        }

//                        $mdDialog.show({
//                            scope: $scope,
//                            preserveScope: true,
//                            clickOutsideToClose: true,
//                            targetEvent: ev,
//                            template: '<md-dialog aria-label="Ajouter un Passage"> \
//                                <md-dialog-content class="sticky-container clearfix"> \
//                                    <md-subheader class="md-sticky-no-effect"><h3 style="margin-bottom: 0">Ajouter un Passage ?</h3></md-subheader> \
//                                    <p style="padding-left: 16px;">Confirmez-vous que ce client est passé en caisse sans utiliser d\'offre et/ou d\'avoir fidélité ?</p> \
//                                </md-dialog-content> \
//                                <div class="md-actions" layout="row"> \
//                                 <div class="clearfix">\
//                                    <md-button class="md-accent md-hue-3" ng-click="addPassage()"> \
//                                    VALIDER \
//                                    </md-button> \
//                                    <md-button class="md-warn" ng-click="hideDialog()"> \
//                                    ANNULER \
//                                    </md-button> \
//                                 </div> \
//                                </div> \
//                            </md-dialog>'
//                        }).then(function () {
//
//                        }, function () {
//
//                        });
                    };

                    $scope.showAdvanced = function (ev, balance) {
                        if (balance.UseToPay === true) {
                            balanceInUse = balance;

                            $mdDialog.show({
                                clickOutsideToClose: true,
                                targetEvent: ev,
                                controller: 'DialogCtrl',
                                template: '<md-dialog aria-label="Paiement En Avoir"> \
                                <md-dialog-content class="sticky-container clearfix"> \
                                    <md-subheader class="md-sticky-no-effect">PAIEMENT EN AVOIR</md-subheader> \
                                    <div> \
                                        <form action="" name="balancePaymentForm" novalidate>\
                                            <md-input-container> \
                                                <label>Montant</label> \
                                                <input id="balancePaymentInput" ng-minlength="1" ng-pattern="/^[0-9.,]+$/" type="tel" ng-model="balancePayment.value" required> \
                                            </md-input-container> \
                                        </form> \
                                    </div> \
                                    </md-dialog-content> \
                                    <div class="md-actions" layout="row"> \
                                     <div class="clearfix"> \
                                        <md-button class="md-accent md-hue-3" ng-disabled="balancePaymentForm.$invalid || balancePaymentForm.$pristine" ng-click="useBalanceToPay(balancePayment.value)"> \
                                        VALIDER \
                                        </md-button> \
                                        <md-button class="md-warn" ng-click="cancel()"> \
                                        ANNULER \
                                        </md-button> \
                                     </div> \
                                    </div> \
                                </md-dialog>'
                            }).then(function () {

                            }, function () {

                            });
                            $log.info('dialog then');
                            $timeout(function () {
                                $('#balancePaymentInput').focus(); //jshint ignore:line
                            }, 500);
                        } else {
                            return false;
                        }
                    };


                    /** Check barcode */
                    checkBarcode($scope.barcode);

                    /** If the barcode defined in the parameters is valid,*/
                    $scope.barcodeValid ? displayData() : $scope.hideData = true;
                }

            ]
        };
    })

/** ngEnter directive for handling enter keypress on inputs (from: http://eric.sau.pe/angularjs-detect-enter-key-ngenter/) */
    .directive('ngEnter', function () {
        return function (scope, element, attrs) {
            element.bind("keydown keypress", function (event) {
                if (event.which === 13) {
                    scope.$apply(function () {
                        scope.$eval(attrs.ngEnter);
                    });
                    event.preventDefault();
                }
            });
        };
    })

    .controller('DialogCtrl', ['$scope', '$rootScope', '$mdDialog', function ($scope, $rootScope, $mdDialog) {
        $scope.hide = function () {
            $mdDialog.hide();
            $('md-backdrop, .md-dialog-container').remove(); //jshint ignore:line
        };

        $scope.cancel = function () {
            $mdDialog.cancel();
            $('md-backdrop, .md-dialog-container').remove(); //jshint ignore:line
        };

        $scope.useBalanceToPay = function (val) {
            $rootScope.useBalanceToPay(val);
            $scope.hide();
        };
    }])

/** compareTo directive for validating that an input value is equal to another **/
    .directive('compareTo', function () {
        return {
            require: "ngModel",
            scope: {
                otherModelValue: "=compareTo"
            },
            link: function (scope, element, attributes, ngModel) {

                ngModel.$validators.compareTo = function (modelValue) {
                    return modelValue === scope.otherModelValue;
                };

                scope.$watch("otherModelValue", function () {
                    ngModel.$validate();
                });
            }
        };
    }
);