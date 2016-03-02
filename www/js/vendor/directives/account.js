"use strict";

var accountApp = angular.module('AccountApp', ['pascalprecht.translate']);

accountApp

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
                '$scope', '$rootScope', '$element', '$attrs', '$http', '$window', '$timeout', '$log', '$mdDialog', '$mdToast', '$animate', '$firebaseObject', '$firebaseArray', 'APIService', '$translate',
                function ($scope, $rootScope, $element, $attrs, $http, $window, $timeout, $log, $mdDialog, $mdToast, $animate, $firebaseObject, $firebaseArray, APIService, $translate) {

                    $scope.isReady = false;
                    $rootScope.isReady = false;

                    $scope.changeLanguage = function (lang) {
                    	window.localStorage.setItem("CurrentLanguage",lang);
                    	$translate.use(lang);
                    	//$window.location.reload();
                    	$rootScope.reload();
                    }

                    document.addEventListener("deviceready", onDeviceReady, false);

                    document.addEventListener("backbutton", function (event) {
                    	event.preventDefault();
                    	event.stopPropagation();

                    	if ($scope.tryExit == true) {
                    		try {
                    			navigator.app.exitApp();
                    		}
                    		catch (err) {
     
                    		}
                    	} else {
                    		$scope.tryExit = true;
                    		try {
                    			$scope.toast($translate.instant($translate.instant("Appuyez une autre fois pour quitter")));
                    		}
                    		catch (err) {

                    		}
                    		setTimeout(function () { $scope.tryExit = false; }, 2000);
                    	}

                    }, false);

                    /** Initial setup */
                    //$timeout(function () {
                    //    if (!window.phonegap) {
                    //        !APIService.get.debugState() ?
                    //            $window.alert('The app is running in a browser, no UUID found!') :
                    //            $log.info('The app is running in a browser, no UUID found!');
                    //        $scope.isBrowser = true;
                    //    }
                    //}, 0);

                    /** @function generateUUID
                     *  Permet de générer un UUID aléatoire pour la version navigateur de l'appli (l'uuid est fourni par phonegap si l'app tourne sur un device).
                     *  @returns {string} l'UUID qui sera enregistré dans le BO et dans le localStorage pour qu'il reste le même. */
                    function generateUUID() {
                        var d = new Date().getTime();
                        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxx'.replace(/[xy]/g, function (c) {
                            var r = (d + Math.random() * 16) % 16 | 0;
                            d = Math.floor(d / 16);
                            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
                        });
                        return uuid + "-browser";
                    }


                    $timeout(function () {
                    	/** Si l'app tourne dans un navigateur, on récupère l'UUID stocké dans le localStorage ou on en génère un si c'est la 1ere visite du client */
                    	if (!window.device) {
                    		var storedUUID = localStorage.getItem('deviceUUID');
                    		if (!storedUUID) {
                    			$scope.randomUUID = generateUUID();
                    			localStorage.setItem('deviceUUID', $scope.randomUUID);
                    			storedUUID = $scope.randomUUID;
                    		}
                    		window.device = { uuid: storedUUID };
                    		window.phonegap = true;
                    		$scope.isBrowser = true;
                    		onDeviceReady();
                    	} else {
                    		$scope.isBrowser = false;
                    	}
                    }, 2000);

                    /** @function blackOrWhite
                     *  Cette fonction retourne blanc ou noir en fonction de la couleur passée en paramètre pour la meilleure visibilité.
                     *  Si la couleur passée est trop sombre pour que du noir (#333) soit visible dessus, la fonction retournera blanc (#fefefe), et inversement.
                     *  @param hexcolor la couleur à comparer (en général la couleur du fond)
                     *  @returns {string} soit '#333' soit '#fefefe' */
                    function blackOrWhite(hexcolor) {
                        var color = hexcolor.substring(1);
                        hexcolor = color.length < 5 ? color + color : color;
                        var r = parseInt(hexcolor.substr(0, 2), 16);
                        var g = parseInt(hexcolor.substr(2, 2), 16);
                        var b = parseInt(hexcolor.substr(4, 2), 16);
                        var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
                        return (yiq >= 125) ? '#333' : '#fefefe';
                    }

                    function configureApp(dataApp) {
                    	$scope.appconfiguration = {
                    		clientSearch: true,
							clientView: true
                    	};

                    	if (dataApp.LoyaltyAppType) {
                    		switch (dataApp.LoyaltyAppType) {
                    			case LoyaltyAppType.PartialCustomerRegisterOnly:
                    				$scope.appconfiguration.clientSearch = false;
                    				$scope.appconfiguration.clientView = false;
                    				break;
                    		}
                    	}

                    }

                    /** @function onDeviceReady
                     *  Fonction appellée par défaut par phonegap une fois qu'il est prêt. Si l'appli tourne dans un navigateur, cette fonction est quand même appellée et window.device est défini (voir l.48) */
                    function onDeviceReady() {
                        if (window.device) {
                             /** Si aucune url client n'est fournie (par paramètre sur la directive, param url ou autre), on utilise une url par défaut pour pouvoir appeller GetServerUrl
                             *  Sinon, on applique l'url déjà présente. */
                        	if (!$scope.clientUrl) APIService.set.clientUrl('http://izi-resto.izipass.pro');
                            else APIService.set.clientUrl($scope.clientUrl);

                        	/** On apelle GetServerUrl en passant en paramètre l'UUID du device ou navigateur actuel */
                        	var callableServerUrl = APIService.get.callableUrl("GetServerUrl?Hardware_Id=" + window.device.uuid);
                        	$http.get(callableServerUrl).success(function (data) {
                                $scope.deviceName = data.AppName;
                                $rootScope.deviceName = data.AppName;

								/** Configuration de l'application */
                                configureApp(data);

                                /** Si aucune url n'est retournée par l'API, ce device n'est pas relié à la fidélité dans le BO */
                                if (!data.Server_Url) {
                                	$scope.deviceNotRegistered = true;
                                	$rootScope.deviceNotRegistered = true;
                                	customAlert("Merci de contacter votre interlocuteur IziPass", "UUID: " + window.device.uuid, function () {
                                		if (navigator.app) {
                                			navigator.app.exitApp();
                                		} else if (navigator.device) {
                                			navigator.device.exitApp();
                                		}
                                	});
                                	return;
                                }
                                /** Sinon, on applique cette url, et on récupère la config firebase pour essayer de trouver l'appli qui correspond à l'url renvoyée par l'api */
                                APIService.set.clientUrl(data.Server_Url);
                                $scope.clientUrl = data.Server_Url;
                                var confTableRef = new Firebase("https://izigenerator.firebaseio.com/config");
                                var confTable = $firebaseArray(confTableRef);

                                confTable.$loaded().then(function (data) {
                                    $scope.configuration = data;

                                    /** On itère sur les configs, si une des configs contient notre url on l'ajoute aux résultats */
                                    var result = $.grep(data, function (e) {
                                        return e.url ? e.url.indexOf($scope.clientUrl.replace('www.', '')) > -1 : 0;
                                    });

                                    /** TODO: prévoir le cas où plusieurs configs existent avec la même url
                                     * Pour l'instant, on prends le 1er resultat et on utilise son url de firebase pour récupérer les données de personalisation */
                                    if (result[0]) {
                                        $scope.firebase = result[result.length - 1].firebase;
                                        var ref = new Firebase($scope.firebase); //jshint ignore:line

                                        $scope.data = $firebaseObject(ref);

                                        $scope.data.$loaded()
                                            .then(function (data) {
                                                /** On a notre data, on cache le loader, on affiche la vue et on fait la customization */
                                                $scope.isReady = true;
                                                $rootScope.isReady = true;

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

                                                $scope.customization = data;
                                                /** Get the customization data from firebase and build css style from it */
                                                angular.element(document).find('head').append("<style type='text/css'>" +
                                                    buildStyleFromData($scope.customization) +
                                                    angular.element('#izi-style').html().replace(/#123456/g, $scope.customization.styling.mainColor).replace(/#654321/g, $scope.customization.styling.secondaryColor).replace(/#321654/g, $scope.customization.styling.bgColor ? $scope.customization.styling.bgColor : 'transparent') + "</style>");
                                                angular.element('#izi-style').remove();

                                                !$scope.isBrowser && !$scope.deviceNotRegistered ? $rootScope.scan() : 0;

                                            })
                                            .catch(function (error) {
                                            	console.error("Error:", error);
                                            	$rootScope.deviceNotRegistered = $scope.deviceNotRegistered = true;
                                            }
                                        );
                                    }
                                });

                            }).error(function (e) {
                                $scope.debug ? $log.error(e) : 0;
                            });
                        }
                    }

                    /** @function stripNameOffGoogleFonts
                     *  Récupère juste le nom d'une police à partir d'une url Google Fonts
                     *  @param gfontsUrl l'url Google Fonts
                     *  @returns {string} le nom de la police */
                    function stripNameOffGoogleFonts(gfontsUrl) {
                        return gfontsUrl.replace("http://fonts.googleapis.com/css?family=", "").replace(/:.+/, "").replace("+", " ");
                    }

                    /** @function buildStyleFromData
                     *  Génère tout le css nécéssaire à la personalisation des vues en fonction du data retourné par firebase
                     *  @param data l'objet contenant les données de personalisation, retourné par firebase plus haut.
                     *  @returns {string} le CSS à appliquer */
                    function buildStyleFromData(data) {
                        var mainFontName = stripNameOffGoogleFonts(data.styling.mainFont);
                        var secondaryFontName = stripNameOffGoogleFonts(data.styling.secondaryFont);
                        var fidItemStyle = "";
                        if (data.styling.bgColor) {
                            $('html, body, ion-view').css('background', data.styling.bgColor);
                            $('.izi-account input').css('background-color', data.styling.bgColor + ' !important');

                            if (data.styling.bgColor !== "transparent" && data.styling.bgColor !== "#ffffff" && data.styling.bgColor !== "#fff") {
                                fidItemStyle = ".izi-account .fid-item-title," +
                                    ".izi-account .fid-item-title + div b," +
                                    ".izi-account .fid-item-title + input { color: " + blackOrWhite(data.styling.bgColor) + " !important; }" +
                                    ".izi-account .card h4 small, .izi-account .card.error h4 { color: " + data.styling.mainColor + " !important; }" +
                                    ".izi-account .alert p, .izi-account .barcode-container small { color: " + blackOrWhite(blackOrWhite(data.styling.bgColor)) + " !important;  font-family: " + secondaryFontName + ", Helvetica, Arial, sans-serif !important; }" +
									".izi-account .card h4 { color: " + data.styling.mainColor + " !important;  font-family: " + secondaryFontName + ", Helvetica, Arial, sans-serif !important; }"
                            }
                        }

                        return "@import url(" + data.styling.mainFont + ");" +
                            "@import url(" + data.styling.secondaryFont + ");" +
                            ".izi-account h1, .izi-account h2, .izi-account h3:not(.fid-item-title) { color: " + data.styling.mainColor + " !important; font-family:" + mainFontName + ", Helvetica, Arial, sans-serif !important; }" +
                            ".izi-account h4, .izi-account h5, .izi-account p, .izi-account a, .izi-account small, .izi-account p, .izi-account label { color: " + data.styling.secondaryColor + " !important; font-family: " + secondaryFontName + ", Helvetica, Arial, sans-serif !important; }" +
                            ".izi-account .fid-item-title { font-family:" + mainFontName + ", Helvetica, Arial, sans-serif !important; }" +
                            ".izi-account input { color: " + data.styling.secondaryColor + " !important; font-family: " + secondaryFontName + ", Helvetica, Arial, sans-serif !important; }" +
                            ".izi-account .fid-item-title + div b, .izi-account .fid-item-title + input { font-family:" + secondaryFontName + ", Helvetica, Arial, sans-serif !important; }" +
                            ".izi-account a, .izi-account a:hover { color: " + data.styling.mainColor + " !important; } " +
                            ".izi-account md-radio-button{ background: " + data.styling.mainColor + "; padding: 16px; }" +
                            ".izi-account button, .izi-account .input-group-addon, .izi-account md-radio-button { color: " + blackOrWhite(data.styling.mainColor) + " !important;  font-family: " + secondaryFontName + ", Helvetica, Arial, sans-serif !important; }" +
                            fidItemStyle;
                    }


                    function customAlert(newTitle,newText,callback) {
                        swal({
                            title: newTitle,
                            text: newText,
                            showCancelButton: false,
                            confirmButtonColor: $scope.customization ? $scope.customization.styling.mainColor : "#28A54C",
                            confirmButtonText: "OK",
                            closeOnCancel: false,
                            closeOnConfirm: true
                        }, callback);
                    }

                    function customConfirm(newTitle, newText, callback) {
                        swal({
                            title: newTitle,
                            text: newText,
                            showCancelButton: true,
                            confirmButtonColor: $scope.customization ? $scope.customization.styling.mainColor : "#28A54C",
                            confirmButtonText: $translate.instant("Oui"),
                            cancelButtonText: $translate.instant("Non"),
                            closeOnCancel: true,
                            closeOnConfirm: true
                        }, callback);
                    }

                    $scope.toastPosition = {
                        bottom: true,
                        top: false,
                        left: false,
                        right: true
                    };

                    /** @function $scope.getToastPosition Utility function for material toast
                     *  @returns {string} The toast position */
                    $scope.getToastPosition = function (toastPosition) {
                    	var position = toastPosition || $scope.toastPosition;
                    	var ret = Object.keys(position)
                            .filter(function (pos) {
                            	return position[pos];
                            })
                            .join(' ');
                    	return ret;
                    };

                    /** @function toast Displays a toast with a message
                     *  @param {string} message The message to display in the toast */
                    $scope.toast = function (message, toastPosition) {
                        $mdToast.show(
                            $mdToast.simple()
                                .content(message)
                                .position($scope.getToastPosition(toastPosition))
                                .hideDelay(1500)
                        );
                    };

                    $scope.form = {};
                    $scope.QRCodeValid = true;
                    $scope.client = {};
                    var balanceInUse;

                    $attrs.$observe('barcode', function (passedBarcode) {
                        checkBarcode(passedBarcode);
                        $scope.scannedBarcode = passedBarcode;
                        $scope.barcodeValid ? displayData() : 0;
                    });

                    $scope.customStyle ? angular.element(document).find('head').prepend("<style type='text/css'>" + $scope.customStyle + "</style>") : 0;

                    /** @function checkBarcode
                     *  Si le barcode semble valide, on l'affecte à $scope.barcode, sinon on supprime $scope.barcode
                     *  @param barcode */
                    function checkBarcode(barcode) {
                        ($scope.barcodeValid = !!(barcode && APIService.validate.barcode(barcode))) ? $scope.barcode = barcode : delete $scope.barcode;
                    }

                    $scope.hideSearchView = function () {
                        $scope.showSearchView = false;
                    };

                	/** @function containsBalanceType
					 * Retourne si les offres de fid contiennent le type de balance en paramètre */
                    $scope.containsBalanceType = function (balanceType) {
                    	var ret = false;

                    	if ($scope.data && $scope.data.Balances && $scope.data.Balances.length > 0) {
                    		ret = Enumerable.from($scope.data.Balances).any(function (balance) {
                    			return balance.BalanceType == balanceType;
                    		});
                    	}

                    	return ret;
                    };

                    /** @function displayData
                     *  Fonction permettant d'identifier un client ou un QR de type offre */
                    function displayData() {
                        $scope.isReady = false;
                        $scope.scannedBarcode = $scope.barcode;
                        $scope.showSearchView = false;
                        APIService.get.loyaltyObject($scope.barcode, function (data) {
                            $log.info('loyalty object:', data);
                            $scope.isReady = true;
                            // Si l'API retourne false, la carte est inconnue
                            if (data === false) {
                            	customAlert($translate.instant("Carte inconnue !"), "", function () {
                            		$scope.reset();
                            		$scope.backToLogin();
                            	});

                                // Si l'API ne retourne pas de Barcode, ce QR est une offre
                            } else if (data.Barcodes && data.Barcodes.length === 0 && data.LoyaltyObjectId === 0) {
                                if (data.Offers !== []) {
                                    $scope.showVoucherView = true;
                                    $scope.voucher = data.Offers[0];
                                    if ($scope.voucher.OfferParam) {
                                    	$scope.voucher.OfferParam = JSON.parse($scope.voucher.OfferParam);
                                    }
                                }

                                // Si l'API ne retourne pas de prénom, nom et email, le client n'est pas enregistré
                            } else if (!data.CustomerFirstName && !data.CustomerLastName && !data.CustomerEmail) {
                                $scope.client.barcode = $scope.barcode;

                                // Si cette url accepte le login anonyme, on identifie le client en tant que client anonyme
                                if (data.AllowAnonymous) {
                                	if (data.AnonymousCustomer) {
                                		$scope.data = data;
                                		$scope.data.Offers = APIService.get.formattedOffers(data);
                                		$scope.selectedAction = data.CustomActions ? data.CustomActions[0].Id : null;
                                		$scope.hideData = false;
                                	} else {
                                		APIService.actions.registerAnonymous({Barcode: $scope.client.barcode}).then(function (data) {
                                			$scope.data = data.data;
                                			$scope.data.Offers = APIService.get.formattedOffers(data);
                                			$scope.selectedAction = data.CustomActions ? data.CustomActions[0].Id : null;
                                			$scope.hideData = false;
                                		}).catch(function (error) {
                                			$log.error('registerAnonymous error', error);
                                		});
                                	}

                                } else if (data.CustomerPartial){ //Si la création partielle est autorisée
                                	//$scope.reset();
                                	$scope.goPartialRegister();
                                	
                                } else if (data.AllowCustomerToCreateLoyaltyBarcode) { // Sinon, on envoie le client vers le formulaire d'enregistrement
                                	//$scope.reset();
                                    $scope.goRegister();
                                } else {
                                	customAlert($translate.instant("Carte inconnue !"), "", function () {
                                		$scope.reset();
                                		$scope.backToLogin();
                                	});
                                }

                                // Sinon, le client a bien été identifié, on affiche la vue
                            } else {

                            	if ($scope.appconfiguration.clientView) {
                            		$scope.data = data;
                            		$scope.data.Offers = APIService.get.formattedOffers(data);
                            		$scope.selectedAction = data.CustomActions ? data.CustomActions[0].Id : null;
                            		$scope.hideData = false;
                            	} else {//on autorise pas l'affichage de la vue client, retour au login
                            		customAlert($translate.instant("La carte est enregistrée"), "", function () {
                            			$scope.reset();
                            			$scope.backToLogin();
                            		});
                            	}
                            }
                        });
                    }

                    $scope.getDate = function (date) {
                        return new Date(date);
                    };

                    /** @function disconnect
                     *  Fait confirmer à l'user qu'il veut se déconnecter */
                    $scope.disconnect = function () {
                        //if (navigator.notification) {
                        //    navigator.notification.confirm("Voulez-vous vraiment quitter la fiche client ?", function (btnIndex) {
                        //        if (btnIndex === 1) {
                        //            $scope.reset();
                        //        }
                        //    }, document.title);
                        //} else {
                        //    $window.confirm("Voulez-vous vraiment quitter la fiche client ?") ? (function () {
                        //        $scope.reset();
                        //    })() : 0;
                        //}
                        customConfirm($translate.instant("Voulez-vous quitter la fiche client ?"), "", function (isConfirm) {
                            if (isConfirm) {
                                $scope.reset();
                            }
                        });

                    };

                    /** @function goRegister
                     *  Affiche la vue du formulaire d'enregistrement */
                    $scope.goRegister = function () {
                    	$scope.$evalAsync();
                        $scope.register = true;
                    };

                	/** @function goPartialRegister
                     *  Affiche la vue du formulaire d'enregistrement partiel */
                    $scope.goPartialRegister = function () {
                    	$scope.$evalAsync();
                    	$scope.partialRegister = true;
                    };

                    /** Retourne à l'écran d'accueil depuis le formulaire d'enregistrement */
                    $scope.backToLogin = function () {
                        $scope.reset();
                        $timeout(function () {
                        	$scope.register = false;
                        	$scope.partialRegister = false;
                        }, 0);
                        window.scrollTo(0, 0);
                        !$scope.isBrowser ? $rootScope.scan() : 0;
                    };

                    $scope.login = function (barcode) {
                        var bc;

                        if (barcode) bc = barcode;
                        else if ($scope.form.barcode) bc = $scope.form.barcode;

                        checkBarcode(bc);

                        //if (navigator.notification) {
                        //    $scope.barcodeValid ? displayData() : navigator.notification.alert("Ce n° de carte n'est pas valide !", null, document.title, "OK");
                        //} else {
                        //    $scope.barcodeValid ? displayData() : $window.alert("Ce n° de carte n'est pas valide !");
                        //}

                        $scope.barcodeValid ? displayData() : customAlert($translate.instant("Ce numéro de carte n'est pas valide !"));
                    };

                    $scope.autoLogin = function () {
                        if ($scope.auto) {
                            checkBarcode($scope.form.barcode);
                            //if (navigator.notification) {
                            //    $scope.barcodeValid ? displayData() : navigator.notification.alert("Ce n° de carte n'est pas valide !", null, document.title, "OK");
                            //} else {
                            //    $scope.barcodeValid ? displayData() : $window.alert("Ce n° de carte n'est pas valide !");
                            //}
                            $scope.barcodeValid ? displayData() : customAlert($translate.instant("Ce numéro de carte n'est pas valide !"));
                        }
                    };

                    $scope.hideDialog = function () {
                        $mdDialog.hide();
                        $('md-backdrop, .md-dialog-container').remove(); //jshint ignore:line
                    };

                    /**
                     * @function $scope.reset
                     * réinitialise l'appli en supprimant les variables de $scope créées jusque là, utilisé pour la déconnexion client
                     */
                    $scope.reset = function () {
                        $timeout(function () {
                        	$scope.client = {}; // {barcode: $scope.form.barcode};
                            $scope.showVoucherView = false;
                            delete $scope.barcode;
                            delete $scope.voucher;
                            delete $rootScope.cardNum;
                            delete $scope.form.barcode;
                            delete $scope.form.password;
                        }, 0);
                    };

                    $scope.addPassage = function () {
                        $scope.isAddingPassage = true;
                        var passageObj = APIService.get.emptyPassageObj();
                        APIService.actions.addPassage(passageObj).success(function () {
                            $scope.hideDialog();
                            $scope.isAddingPassage = false;
                            if ($scope.customization.hasPopup) {
                                //var quit = navigator.notification ? navigator.notification.confirm("L'action a bien été effectuée sur cette carte.\n\nvar quit quitter la fiche client\nCancel pour rester sur la fiche client", null, document.title, function(btnIndex) {
                                //    if (btnIndex === 1) {
                                //        $scope.reset();
                                //    }
                                //}) : $window.confirm("L'action a bien été effectuée sur cette carte.\n\nOK pour quitter la fiche client\nCancel pour rester sur la fiche client");
                                //if (quit) {
                                //    $scope.reset();
                                //    $timeout(function () {
                                //        !$scope.isBrowser ? $rootScope.scan() : 0;
                                //    }, 1600);
                                //} else {
                                //    $('#orderAmountInput').val('');
                                //    displayData();
                                //}
                            	customConfirm($translate.instant("L'action a bien été effectuée sur cette carte"), $translate.instant("Voulez-vous quitter la fiche client ?"), function (isConfirm) {
                                    if (isConfirm) {
                                        $scope.reset();
                                        $timeout(function () {
                                            !$scope.isBrowser ? $rootScope.scan() : 0;
                                        }, 1600);
                                    } else {
                                        $('#orderAmountInput').val('');
                                        displayData();
                                    }
                                });
                            } else {
                            	$scope.toast($translate.instant("L'action a bien été effectuée sur cette carte"));
                                $scope.reset();
                                $timeout(function () {
                                    !$scope.isBrowser ? $rootScope.scan() : 0;
                                }, 1600);
                            }
                            return true;
                        });
                    };

                    $scope.resetPassword = function (barcode) {
                        APIService.actions.resetPassword(barcode).then(function (data) {
                            console.log(data);
                        });
                    };

                    $scope.searchForCustomer = function (query) {
                        $scope.isSearching = true;
                        APIService.actions.searchForCustomer(query).then(function (data) {
                            console.log(data);
                            $scope.searchResults = data.data;
                            $scope.isSearching = false;
                        });
                    };

                    $scope.launchClientSearch = function () {
                        $scope.showSearchView = true;
                    };

                    $scope.getTotalPositiveHistory = function (history) {
                        var total = 0;
                        for (var i = 0; i < history.length; i++) {
                            total += history[i].Value > 0 ? history[i].Value : 0;
                        }
                        return total;
                    };

                    /** @function $scope.useBalanceToPay
                     *  @param {number} val The amount of the balance to use for payment
                     *  @param {object} balance The balance object to use */
                    $scope.useBalanceToPay = function (val, balance) {
                        $scope.isUsingBalance = true;
                        var passageObj = APIService.get.emptyPassageObj();

                        if (~~balance.Value < ~~val) {
                            $scope.hasUsedBalance = false;
                            $scope.isUsingBalance = false;
                            //if (navigator.notification) {
                            //    navigator.notification.alert('Ce montant est supérieur au total de la cagnotte', null, document.title, "OK");
                            //} else {
                            //    $window.alert('Ce montant est supérieur au total de la cagnotte');
                            //}
                            customAlert("Ce montant est supérieur au total de la cagnotte");
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
                                $scope.isUsingBalance = false;
                                if ($scope.customization.hasPopup) {
                                    //var quit = navigator.notification ? navigator.notification.confirm("L'action a bien été effectuée sur cette carte.\n\nOK pour quitter la fiche client\nCancel pour rester sur la fiche client", null, document.title, function(btnIndex) {
                                    //    if (btnIndex === 1) {
                                    //        $scope.reset();
                                    //    }
                                    //}) : $window.confirm("L'action a bien été effectuée sur cette carte.\n\nOK pour quitter la fiche client\nCancel pour rester sur la fiche client");
                                    //if (quit) {
                                    //    $scope.reset();
                                    //    $timeout(function () {
                                    //        $scope.hasUsedBalance = false;
                                    //        !$scope.isBrowser ? $rootScope.scan() : 0;
                                    //    }, 1600);
                                    //} else {
                                    //    $('#orderAmountInput').val('');
                                    //    displayData();
                                    //}

                                	customConfirm($translate.instant("L'action a bien été effectuée sur cette carte"), $translate.instant("Voulez-vous quitter la fiche client ?"), function (isConfirm) {
                                        if (isConfirm) {
                                            $scope.reset();
                                            $timeout(function () {
                                                $scope.hasUsedBalance = false;
                                                !$scope.isBrowser ? $rootScope.scan() : 0;
                                            }, 1600);
                                        } else {
                                            $('#orderAmountInput').val('');
                                            displayData();
                                        }
                                    });
                                } else {
                                    $scope.toast($translate.instant("Le paiement en avoir a bien été effectué"));
                                    $scope.reset();
                                    $timeout(function () {
                                        $scope.hasUsedBalance = false;
                                        !$scope.isBrowser ? $rootScope.scan() : 0;
                                    }, 1600);
                                }

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

                        APIService.actions.addPassage(passageObj).success(function () {
                            $mdDialog.hide();
                            $scope.hideDialog();
                            if ($scope.customization.hasPopup) {
                                //var quit = navigator.notification ? navigator.notification.confirm("L'action a bien été effectuée sur cette carte.\n\nOK pour quitter la fiche client\nCancel pour rester sur la fiche client", null, document.title, function(btnIndex) {
                                //    if (btnIndex === 1) {
                                //        $scope.reset();
                                //    }
                                //}) : $window.confirm("L'action a bien été effectuée sur cette carte.\n\nOK pour quitter la fiche client\nCancel pour rester sur la fiche client");
                                //if (quit) {
                                //    $scope.reset();
                                //    $timeout(function () {
                                //        !$scope.isBrowser ? $rootScope.scan() : 0;
                                //    }, 1600);
                                //} else {
                                //    displayData();
                                //}

                            	customConfirm($translate.instant("L'action a bien été effectuée sur cette carte"), $translate.instant("Voulez-vous quitter la fiche client ?"), function (isConfirm) {
                                    if (isConfirm) {
                                        $scope.reset();
                                        $timeout(function () {
                                            !$scope.isBrowser ? $rootScope.scan() : 0;
                                        }, 1600);
                                    } else {
                                        displayData();
                                    }
                                });

                            } else {
                                $scope.toast($translate.instant("L'offre a bien été utilisée"));
                                $scope.reset();
                                $timeout(function () {
                                    !$scope.isBrowser ? $rootScope.scan() : 0;
                                }, 1600);
                            }

                            return true;
                        });
                    };

                    $scope.useVoucherOffer = function (offer) {
                    	APIService.actions.useVoucherOffer(offer.OfferClassId, offer.Barcode).then(function (data) {
                            if (data) {
                                if ($scope.customization.hasPopup) {
                                    //var quit = navigator.notification ? navigator.notification.confirm("L'action a bien été effectuée sur cette carte.\n\nOK pour quitter la fiche client\nCancel pour rester sur la fiche client", null, document.title, function() {
                                    //    if (btnIndex === 1) {
                                    //        $scope.reset();
                                    //    }
                                    //}) : $window.confirm("L'action a bien été effectuée sur cette carte.\n\nOK pour quitter la fiche client\nCancel pour rester sur la fiche client");
                                    //if (quit) {
                                    //    $scope.reset();
                                    //    $timeout(function () {
                                    //        !$scope.isBrowser ? $rootScope.scan() : 0;
                                    //    }, 1600);
                                    //} else {
                                    //    displayData();
                                    //}

                                	customConfirm($translate.instant("L'action a bien été effectuée sur cette carte"), $translate.instant("Voulez-vous quitter la fiche client ?"), function (isConfirm) {
                                        if (isConfirm) {
                                            $scope.reset();
                                            $timeout(function () {
                                                !$scope.isBrowser ? $rootScope.scan() : 0;
                                            }, 1600);

                                        } else {
                                            displayData();
                                        }
                                    });

                                } else {
                                	$scope.toast($translate.instant("L'offre a bien été utilisée"));
                                    $scope.reset();
                                    $timeout(function () {
                                        !$scope.isBrowser ? $rootScope.scan() : 0;
                                    }, 1600);
                                }
                                return true;
                            } else {
                            	$window.alert($translate.instant("Une erreur ")+$translate.instant(" est survenue !"));
                            }
                        }).catch(function (error) {
                            $log.error(error);
                            $window.alert($translate.instant("Une erreur ") + error.status + $translate.instant(" est survenue !"));
                        });
                    };

                    $scope.orderAmount = function (amount) {
                        if (amount) {
                            $scope.isOrderingAmount = true;
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
                                $scope.isOrderingAmount = false;
                                if ($scope.customization.hasPopup) {
                                    //var quit = navigator.notification ? navigator.notification.confirm("L'action a bien été effectuée sur cette carte.\n\nOK pour quitter la fiche client\nCancel pour rester sur la fiche client", null, document.title, function(btnIndex) {
                                    //    if (btnIndex === 1) {
                                    //        $scope.reset();
                                    //    }
                                    //}) : $window.confirm("L'action a bien été effectuée sur cette carte.\n\nOK pour quitter la fiche client\nCancel pour rester sur la fiche client");
                                    //if (quit) {
                                    //    $scope.reset();
                                    //    $timeout(function () {
                                    //        !$scope.isBrowser ? $rootScope.scan() : 0;
                                    //    }, 1600);
                                    //} else {
                                    //    displayData();
                                    //}

                                	customConfirm($translate.instant("L'action a bien été effectuée sur cette carte"), $translate.instant("Voulez-vous quitter la fiche client ?"), function (isConfirm) {
                                        if (isConfirm) {
                                            $scope.reset();
                                            $timeout(function () {
                                                !$scope.isBrowser ? $rootScope.scan() : 0;
                                            }, 1600);

                                        } else {
                                            displayData();
                                        }
                                    });

                                } else {
                                	$scope.toast($translate.instant("L'action a bien été effectuée sur cette carte"));
                                    $scope.reset();
                                    $timeout(function () {
                                        !$scope.isBrowser ? $rootScope.scan() : 0;
                                    }, 1600);
                                }
                                return true;
                            });
                        }
                    };

                    $scope.submitRegister = function () {
                        var obj = {
                            Barcode: $scope.client.barcode,
                            FirstName: $scope.client.firstname,
                            LastName: $scope.client.lastname,
                            Gender: $scope.client.gender,
                            DateOfBirthMonth: $scope.client.birthdate ? $scope.client.birthdate.getMonth() + 1 : "",
                            DateOfBirthDay: $scope.client.birthdate ? $scope.client.birthdate.getDay() : "",
                            DateOfBirthYear: $scope.client.birthdate ? $scope.client.birthdate.getFullYear() : "",
                            Email: $scope.client.email,
                            Phone: $scope.client.tel,
                            StreetAddress: $scope.client.address,
                            ZipPostalCode: $scope.client.zipcode,
                            City: $scope.client.city,
                            Password: $scope.client.password,
                            ConfirmPassword: $scope.client.passwordConfirm
                        };

                        APIService.actions.register(obj).then(function () {
                            $scope.barcode = $scope.client.barcode;
                            $scope.form.password = $scope.client.password;
                            $scope.register = false;
                            $scope.reset();
                            displayData();
                        }).catch(function (error) {
                            if (error.status === 500)
                            	customAlert($translate.instant("Cette carte est déjà enregistrée !"));
                            else customAlert($translate.instant("Une erreur ") + error.status + $translate.instant(" est survenue !"));
                        });
                    };

                    $scope.submitPartialRegister = function () {
                    	var obj = {
                    		Barcode: $scope.client.barcode,
                    		FirstName: $scope.client.firstname,
                    		LastName: $scope.client.lastname,
                    		Email: $scope.client.email,
                    	};

                    	APIService.actions.registerAnonymous(obj).then(function () {
                    		$scope.partialRegister = false;
                    		$scope.barcode = $scope.client.barcode;
                    		$scope.reset();
                    		displayData();
                    	}).catch(function (error) {
                    		if (error.status === 500)
                    			customAlert($translate.instant("Cette carte est déjà enregistrée !"));
                    		else customAlert($translate.instant("Une erreur ") + error.status + $translate.instant(" est survenue !"));
                    	});
                    };

                    $scope.clickAction = function (actionId, isTiles) {
                    	$scope.data.customAction = actionId;
                    	$scope.useAction(true);
                    }

                    $scope.useAction = function (isTiles) {

                        $scope.isUsingAction = true;
                        customConfirm($translate.instant("Voulez-vous effectuer cette action ?"), "", function (isAccept) {
                        	if (isAccept) {
                        		var passageObj = APIService.get.emptyPassageObj();
                        		var amount = $('#orderAmountInput').val();
                        		passageObj.OrderTotalIncludeTaxes = amount;
                        		passageObj.OrderTotalExcludeTaxes = amount;

                        		if (isTiles) {
                        			passageObj.CustomAction = {
                        				"CustomActionId": $scope.data.customAction
                        			};
                        		} else {
                        			passageObj.CustomAction = {
                        				"CustomActionId": $('#actionSelect').val()
                        			};
                        		}
                        		$log.info(passageObj);

                        		APIService.actions.addPassage(passageObj).success(function () {
                        			$scope.hideDialog();
                        			$scope.isUsingAction = false;
                        			if ($scope.customization.hasPopup) {
     
                        				customConfirm($translate.instant("L'action a bien été effectuée sur cette carte"), $translate.instant("Voulez-vous quitter la fiche client ?"), function (isConfirm) {
                        					if (isConfirm) {
                        						$scope.reset();
                        						$timeout(function () {
                        							!$scope.isBrowser ? $rootScope.scan() : 0;
                        						}, 1600);
                        					} else {
                        						$('#orderAmountInput').val('');
                        						displayData();
                        					}
                        				});

                        			} else {
                        				$scope.toast($translate.instant("L'action a bien été effectuée sur cette carte"));
                        				$scope.reset();
                        				$timeout(function () {
                        					!$scope.isBrowser ? $rootScope.scan() : 0;
                        				}, 1600);
                        			}
                        			return true;
                        		});
                        	} else {
                        		$scope.isUsingAction = false;
                        	}
                        });

                    };

                    $scope.showConfirm = function (ev, offer) {

                        customConfirm($translate.instant("Voulez-vous utiliser cette offre ?"), "", function (isConfirm) {
                            if (isConfirm) {
                                $scope.useOffer(offer);
                            } 
                        });
                    };

                    $scope.showAddPassageConfirm = function (ev) {
                        //if (navigator.notification) {
                        //    navigator.notification.confirm("Confirmez-vous que ce client est passé en caisse sans utiliser d'offre et/ou d'avoir fidélité ?", function (btnIndex) {
                        //        if (btnIndex === 1) {
                        //            $scope.addPassage();
                        //        }
                        //    }, document.title);
                        //} else {
                        //    var doUse = $window.confirm("Confirmez-vous que ce client est passé en caisse sans utiliser d'offre et/ou d'avoir fidélité ?");
                        //    if (doUse) $scope.addPassage();
                        //}

                        customConfirm($translate.instant("Confirmez-vous que ce client est passé en caisse sans utiliser d'offre et/ou d'avoir fidélité ?"), "", function (isConfirm) {
                            if (isConfirm) {
                                $scope.addPassage();
                            }
                        });
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

                            $timeout(function () {
                                $('#balancePaymentInput').focus(); //jshint ignore:line
                            }, 500);
                        } else {
                            return false;
                        }
                    };

                    $scope.showClientSearch = function (ev, balance) {
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


var LoyaltyAppType = {
	Default : 0,
	PartialCustomerRegisterOnly : 1
};