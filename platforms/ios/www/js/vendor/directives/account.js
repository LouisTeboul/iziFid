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
                '$scope', '$rootScope', '$element', '$attrs', '$http', '$window', '$timeout', '$log', '$mdDialog', '$mdToast', '$animate', '$firebaseObject', '$firebaseArray', 'APIService',
                function ($scope, $rootScope, $element, $attrs, $http, $window, $timeout, $log, $mdDialog, $mdToast, $animate, $firebaseObject, $firebaseArray, APIService) {

                    $scope.isReady = false;
                    $rootScope.isReady = false;

                    function generateUUID() {
                        var d = new Date().getTime();
                        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxx'.replace(/[xy]/g, function (c) {
                            var r = (d + Math.random() * 16) % 16 | 0;
                            d = Math.floor(d / 16);
                            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
                        });
                        return uuid + "-browser";
                    };

                    if (!window.device) {
                        var storedUUID = localStorage.getItem('deviceUUID');
                        if (!storedUUID) {
                            $scope.randomUUID = generateUUID();
                            localStorage.setItem('deviceUUID', $scope.randomUUID);
                            storedUUID = $scope.randomUUID;
                        }
                        window.device = {uuid: storedUUID};
                        window.phonegap = true;
                        onDeviceReady();
                    }

                    function blackOrWhite(hexcolor) {
                        var color = hexcolor.substring(1);
                        hexcolor = color.length < 5 ? color + color : color;
                        var r = parseInt(hexcolor.substr(0, 2), 16);
                        var g = parseInt(hexcolor.substr(2, 2), 16);
                        var b = parseInt(hexcolor.substr(4, 2), 16);
                        var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
                        return (yiq >= 125) ? '#333' : '#eee';
                    }

                    function onDeviceReady() {
                        if (window.device) {
                            $scope.isBrowser = false;
                            if (!$scope.clientUrl) APIService.set.clientUrl('http://ffpizza.izipass.pro');
                            else APIService.set.clientUrl($scope.clientUrl);

                            // On appelle GetServerUrl pour récupérer l'url attachée au device
                            $http.get(APIService.get.callableUrl("GetServerUrl?Hardware_Id=" + window.device.uuid)).success(function (data) {
                                $scope.deviceName = data.AppName;
                                $rootScope.deviceName = data.AppName;

                                // Si réponse vide le device n'est pas configuré
                                if (!data.Server_Url) alert("Cet appareil n'est pas relié à la fidélité !\n\nUUID: " + window.device.uuid);

                                APIService.set.clientUrl(data.Server_Url);
                                $scope.clientUrl = data.Server_Url;
                                var confTableRef = new Firebase("https://izigenerator.firebaseio.com/config");
                                var confTable = $firebaseArray(confTableRef);

                                // On charge la config
                                confTable.$loaded().then(function (data) {
                                    $scope.configuration = data;

                                    var result = $.grep(data, function (e) {
                                        return e.url ? e.url.indexOf($scope.clientUrl.replace('www.', '')) > -1 : 0;
                                    });

                                    if (result[0]) {
                                        $scope.firebase = result[result.length - 1].firebase;
                                        var ref = new Firebase($scope.firebase); //jshint ignore:line

                                        $scope.data = $firebaseObject(ref);

                                        $scope.data.$loaded()
                                            .then(function (data) {
                                                $scope.isReady = true;
                                                $rootScope.isReady = true;

                                                // On customize en fonction du data
                                                document.title = data.title;
                                                var topHeader = $('.bar-header h1');
                                                topHeader.text(data.title.replace('Fidélité', ''));
                                                topHeader.attr('style', 'font-family: "' + stripNameOffGoogleFonts(data.styling.mainFont) + '", Abel, Arial, sans-serif !important; text-align: center; margin-bottom: 2px; margin-left: -60px; font-weight: 400; font-size: 2em;');
                                                $('.bar-header').css('background-color', data.styling.primaryColor);
                                                $('.button-fab-top-right').css('background-color', data.styling.mainColor).css('border-color', data.styling.mainColor);
                                                var body = $('body');
                                                var bgColor = body.css('background-color');
                                                if (bgColor === "rgb(255, 255, 255)") {
                                                    bgColor = "#ffffff";
                                                }
                                                var properColor = blackOrWhite(bgColor);

                                                body.css('color', properColor + ' !important');
                                                $('h4').css('color', properColor + ' !important');

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
                                });

                            }).error(function (e) {
                                $scope.debug ? $log.error(e) : 0;
                            });

                        }
                    }

                    document.addEventListener("deviceready", onDeviceReady, false);

                    /** Initial setup */
                    $timeout(function () {
                        if (!window.phonegap) {
                            !APIService.get.debugState() ?
                                $window.alert('The app is running in a browser, no UUID found!') :
                                $log.info('The app is running in a browser, no UUID found!');
                            $scope.isBrowser = true;
                        }
                    }, 0);


                    function stripNameOffGoogleFonts(gfontsUrl) {
                        return gfontsUrl.replace("http://fonts.googleapis.com/css?family=", "").replace(/:.+/, "").replace("+", " ");
                    }

                    function buildStyleFromData(data) {
                        var mainFontName = stripNameOffGoogleFonts(data.styling.mainFont);
                        var secondaryFontName = stripNameOffGoogleFonts(data.styling.secondaryFont);
                        var fidItemColor, fidItemStyle = "";
                        if (data.styling.bgColor) {
                            $('html, body').css('background', data.styling.bgColor);
                            if (data.styling.bgColor !== "transparent" && data.styling.bgColor !== "#ffffff" && data.styling.bgColor !== "#fff") {
                                fidItemColor = data.styling.bgColor;
                                fidItemStyle = ".izi-account .fid-item-title," +
                                    ".izi-account .fid-item-title + div b," +
                                    ".izi-account .fid-item-title + input { color: " + fidItemColor + " !important; }"
                            }
                        }

                        return "@import url(" + data.styling.mainFont + ");" +
                            "@import url(" + data.styling.secondaryFont + ");" +
                            ".izi-account h1, .izi-account h2, .izi-account h3:not(.fid-item-title) { color: " + data.styling.mainColor + " !important; font-family:" + mainFontName + ", Helvetica, Arial, sans-serif !important; }" +
                            ".izi-account h4, .izi-account h5, .izi-account p, .izi-account a, .izi-account small, .izi-account p, .izi-account input, .izi-account label { color: " + data.styling.secondaryColor + " !important; font-family: " + secondaryFontName + ", Helvetica, Arial, sans-serif !important; }" +
                            ".izi-account .fid-item-title { font-family:" + mainFontName + ", Helvetica, Arial, sans-serif !important; }" +
                            ".izi-account .fid-item-title + div b, .izi-account .fid-item-title + input { font-family:" + secondaryFontName + ", Helvetica, Arial, sans-serif !important; }" +
                            ".izi-account a, .izi-account a:hover { color: " + data.styling.mainColor + " !important; } " +
                            ".izi-account button { color: " + invertColor(data.styling.secondaryColor) + " !important;  font-family: " + secondaryFontName + ", Helvetica, Arial, sans-serif !important; }" +
                            fidItemStyle;
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
                        APIService.get.loyaltyObject($scope.barcode, function (data) {
                            $log.info('loyalty object:', data);
                            $scope.isReady = true;
                            if (data === false) {
                                $scope.reset();
                                navigator.notification.alert('Carte inconnue !', null, document.title, "OK");
//                                $window.alert('Carte inconnue !');
                                !$scope.isBrowser ? $rootScope.scan() : 0;
                            } else if (data.Barcodes && data.Barcodes.length === 0 && data.LoyaltyObjectId === 0) {
                                //Voucher
                                if (data.Offers !== []) {
                                    $scope.showVoucherView = true;
                                    $scope.voucher = data.Offers[0];
                                }
                            } else if (!data.CustomerFirstName && !data.CustomerLastName && !data.CustomerEmail) {
                                $scope.client.barcode = $scope.barcode;
                                if (data.AllowAnonymous) {
                                    if (data.AnonymousCustomer) {
                                        $scope.data = data;
                                        $scope.data.Offers = APIService.get.formattedOffers(data);
                                        $scope.selectedAction = data.CustomActions ? data.CustomActions[0].Id : null;
                                        $scope.hideData = false;
                                    } else {
                                        APIService.actions.registerAnonymous({Barcode: $scope.client.barcode}).then(function (data) {
                                            console.log('registerAnonymousData', data);
                                            $scope.data = data.data;
                                            $scope.data.Offers = APIService.get.formattedOffers(data);
                                            $scope.selectedAction = data.CustomActions ? data.CustomActions[0].Id : null;
                                            $scope.hideData = false;
                                        }).catch(function (error) {
                                            console.log('error', error);
                                        });
                                    }
                                } else {
                                    $scope.reset();
                                    $scope.goRegister();
                                }
                            } else {
                                $scope.data = data;
                                $scope.data.Offers = APIService.get.formattedOffers(data);
                                $scope.selectedAction = data.CustomActions ? data.CustomActions[0].Id : null;
                                $scope.hideData = false;
                            }
                        });
                    }

                    $scope.getDate = function (date) {
                        return new Date(date);
                    };

                    /** Disconnect function */
                    $scope.disconnect = function () {
                        if (navigator.notification) {
                            navigator.notification.confirm('Êtes-vous sûr de vouloir vous déconnecter ?', function () {
                                $scope.reset();
                            }, document.title);
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
                            $scope.barcodeValid ? displayData() : navigator.notification.alert("Ce n° de carte n'est pas valide !", null, document.title, "OK");
                        } else {
                            $scope.barcodeValid ? displayData() : $window.alert("Ce n° de carte n'est pas valide !");
                        }
                    };

                    $scope.autoLogin = function () {
                        if ($scope.auto) {
                            checkBarcode($scope.form.barcode);
                            if (navigator.notification) {
                                $scope.barcodeValid ? displayData() : navigator.notification.alert("Ce n° de carte n'est pas valide !", null, document.title, "OK");
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
                        $scope.client = { barcode: $scope.form.barcode };
                        $scope.showVoucherView = false;
                        delete $scope.barcode;
                        delete $scope.voucher;
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

                    /**
                     * @function $scope.useBalanceToPay
                     * @param {number} val The amount of the balance to use for payment
                     * @param {object} balance The balance object to use */
                    $scope.useBalanceToPay = function (val, balance) {
                        var passageObj = APIService.get.emptyPassageObj();

                        if (~~balance.Value < ~~val) {
                            if (navigator.notification) {
                                navigator.notification.alert('Ce montant est supérieur au total de la cagnotte', null, document.title, "OK");
                            } else {
                                $window.alert('Ce montant est supérieur au total de la cagnotte');
                            }
                            return false;
                        } else {
                            $scope.hasUsedBalance = true;
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

                    $scope.useVoucherOffer = function (offer) {
                        APIService.actions.useVoucherOffer(offer.OfferClassId).then(function(data) {
                            if (data) {
                                $scope.toast("L'offre a bien été utilisée");
                                $scope.reset();
                                $timeout(function () {
                                    !$scope.isBrowser ? $rootScope.scan() : 0;
                                }, 1600);
                                return true;
                            } else {
                                $window.alert('Une erreur est survenue, l\'offre n\'a pas été utilisée !');
                            }
                        }).catch(function (error) {
                            console.log(error);
                            $window.alert('Une erreur ' + error.status + ' est survenue !');
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
                        }).catch(function(error) {
                            if (error.status === 500)
                                $window.alert('Cette carte est déjà enregistrée !');
                            else
                                $window.alert('Une erreur ' + error.status + ' est survenue !');
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
                            }, document.title);
                        } else {
                            var doUse = $window.confirm("Voulez-vous utiliser cette offre ?");
                            if (doUse) $scope.useOffer(offer);
                        }
                    };

                    $scope.showAddPassageConfirm = function (ev) {
                        if (navigator.notification) {
                            navigator.notification.confirm("Confirmez-vous que ce client est passé en caisse sans utiliser d'offre et/ou d'avoir fidélité ?", function () {
                                $scope.addPassage();
                            }, document.title);
                        } else {
                            var doUse = $window.confirm("Confirmez-vous que ce client est passé en caisse sans utiliser d'offre et/ou d'avoir fidélité ?");
                            if (doUse) $scope.addPassage();
                        }
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