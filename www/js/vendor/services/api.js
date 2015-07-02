'use strict';

/**
 * @author Louis Teboul (louis.teboul@izi-pass.com)
 * @overview Service AngularJS faisant l'abstraction entre l'API SmartStore et les apps Angular
 */

/** @module APIService */

angular.module('APIServiceApp', []).factory('APIService', ['$http', '$log', '$timeout', function ($http, $log, $timeout) {
    var methods, vars, errors, fakeData, emptyData, passagePromise = null;

    /** @namespace module:APIService~vars
     *  @description Variables & Flags
     *  @property {string} endpoint - The API endpoint path, without the domain name and params
     *  @property {string} clientUrl - The domain name of the partner's back-office we want to hit (e.g: http://ffpizza.izipass.pro). This is set either via the client-url attribute of the <izi-account> element, or via the APIService#set.clientUrl(x) method
     *  @property {boolean} debug - If false, the service will not log anything to the console
     *  @property {object} currLoyaltyObject - An object to keep reference of the current user
     *  @property {array} validClientUrls - Whitelist for the client urls (see {@link clientUrl}) */
    vars = {
        endpoint: "/api/RESTLoyalty/RESTLoyalty/",
        clientUrl: "",
        fake: false,
        debug: true,
        currLoyaltyObject: {},
        validClientUrls: [
            "http://pitapit.fr",
            "http://urbun.fr",
            "http://beautyburger.com",
            "http://madamecroque.fr",
            "http://planetalis.com",
            "http://cooking.izipass.pro",
            "http://ffpizza.izipass.pro",
            "http://bellacci.izipass.pro",
            "http://le-b.izipass.pro",
            "http://le-b2.izipass.pro"
        ]
    };

    /** @namespace module:APIService~errors
     *  @description Shortcut methods to throw the various possible errors, if vars.debug is true */
    errors = {
        /** @function missingClientUrl
         *  @memberof module:APIService~errors
         *  @returns {error} The error to throw in case vars.clientUrl is not defined (@see vars.clientUrl) */
        missingClientUrl: function () {
            return vars.debug ? $log.error("Client URL is not set! Use APIService.set.clientUrl(xxx)") : 0;
        },

        /** @function invalidBarcode
         *  @memberof module:APIService~errors
         *  @param {number} barcode - The invalid barcode
         *  @returns {error} The error to throw for an invalid barcode */
        invalidBarcode: function (barcode) {
            return vars.debug ? $log.error("Barcode is not valid:", barcode) : 0;
        },

        notLoggedIn: function () {
            return vars.debug ? $log.error("No client logged in") : 0;
        },

        /** @function addPassage
         *  @description Adds a passage without using an offer or paying with a balance
         *  @memberof module:APIService~errors
         *  @returns {error} The error to throw if methods.actions.addPassage returns false (@see methods.actions.addPassage) */
        addPassage: function () {
            return vars.debug ? $log.error("AddPassage ERROR, API returned false.") : 0;
        }
    };

    /** @namespace module:APIService~methods
     *  @description Methods exposed by the service  */
    methods = {
        /** @namespace module:APIService~set
         *  @description Methods for setting variables */
        set: {
            /** @function clientUrl
             *  @description Sets the client-url to use
             *  @memberof module:APIService~set
             *  @params {string} url - The client-url to set (@see vars.clientUrl) */
            clientUrl: function (url) {
                vars.clientUrl = url;
            },

            /** @function endpoint
             *  @description Sets the endpoint path to use
             *  @memberof module:APIService~set
             *  @params {string} endpoint - The API's endpoint path without the domain name or parameters (@see vars.endpoint) */
            endpoint: function (endpoint) {
                vars.endpoint = endpoint;
            },

            /** @function debug
             *  @description Allows to toggle debug mode (= logging in the console) on & off
             *  @memberof module:APIService~set
             *  @params {boolean} bool */
            debug: function (bool) {
                vars.debug = !!bool;
            },

            /** @function methods.set.fake(@param bool)
             *  @description If set to true, we will use the fake data below for testing instead of actually calling the API
             *  @params {boolean} bool - Self-explanatory */
            fake: function (bool) {
                vars.fake = !!bool;
            }
        },

        /** @namespace module:APIService~get
         *  @description Methods returning data */
        get: {
            /** @function callableUrl
             *  @description Returns the complete url to call an API method from the client url, the endpoint and the parameters
             *  @memberof APIService.get
             *  @param {string} params - The URL parameters to pass to the endpoint (e.g: '?barcode=12345678')
             *  @returns {string} The full URL to use in our $http calls */
            callableUrl: function (params) {
                return methods.validate.clientUrl() ? vars.clientUrl + vars.endpoint + params : errors.missingClientUrl();
            },

            /** @function emptyData
             *  @description Returns a local copy of an empty loyaltyObject
             *  @memberof APIService.get
             *  @returns {object} A local copy of an empty response from the API */
            emptyData: function () {
                return emptyData;
            },

            /** @function debugState
             *  @description Returns true if debugging is enabled
             *  @memberof APIService.get
             *  @returns {boolean} */
            debugState: function () {
                return vars.debug;
            },

            /** @function serverUrl
             *  @description Get the correct clientUrl for the current device
             *  @memberof APIService.get
             *  @param uuid - The device's Universal Unique Identifier, retrieved via phonegap/cordova */
            serverUrl: function(uuid, callback) {
                return $http.get(methods.get.callableUrl("GetServerUrl?Hardware_Id=" + uuid)).success(function (data) {
                   $log.info('getServerUrl', data);
                   if (data.Server_Url) {
                       callback(data.Server_Url);
                   } else {
                       methods.set.clientUrl("");
                       window.alert("Cet appareil n'est pas relié à la fidélité (UUID: " + uuid + ")");
                   }
               }).error(function (e) {
                   vars.debug ? $log.error(e) : 0;
               });
            },

            /** @function loyaltyObject
             *  @description Get the data associated with a particular barcode
             *  @memberof APIService.get
             *  @param {number|string} barcode - The barcode we want to retrieve data from
             *  @param {function} func - A callback function to which we pass the data
             *  @returns {function|error} Either a call to the callback function that was passed, or an error */
            loyaltyObject: function (barcode, func) {
                return $timeout(function () {
                    var isBarcodeValid = methods.validate.barcode(barcode),
                        isClientUrlValid = methods.validate.clientUrl();
                    if (isBarcodeValid && isClientUrlValid) {
                        if (vars.fake) {
                            vars.currLoyaltyObject = fakeData;
                            return func(fakeData);
                        } else {
                            $http.get(methods.get.callableUrl("GetloyaltyObject?barcode=" + barcode)).success(function (data) {
                                $log.info('DATA: ', data.Offers);
                                vars.currLoyaltyObject = data;
                                return func(data);
                            }).error(function (e) {
                                vars.debug ? $log.error(e) : 0;
                                return func(false);
                            });
                        }
                    } else {
                        return isBarcodeValid ? errors.missingClientUrl() : errors.invalidBarcode(barcode);
                    }
                }, 0);
            },

            /** @function methods.get.loyaltyObjectWithPassword(@param barcode)
             *  Get the data associated with a particular barcode
             * @param barcode [type: number]
             * The barcode we want to retrieve data from
             * @param func [type: function]
             * @param password The user's password
             * A callback function to which we pass the data */
            loyaltyObjectWithPassword: function (barcode, password, func) {
                return $timeout(function () {
                    var isBarcodeValid = methods.validate.barcode(barcode),
                        isClientUrlValid = methods.validate.clientUrl();
                    if (isBarcodeValid && isClientUrlValid) {
                        $http.get(methods.get.callableUrl("GetloyaltyObject?login=" + barcode + "&password=" + password)).success(function (data) {
                            $log.info('DATA: ', data.Offers);
                            vars.currLoyaltyObject = data;
                            return func(data);
                        }).error(function (e) {
                            vars.debug ? $log.error(e) : 0;
                            return func(false);
                        });
                    } else return isBarcodeValid ? errors.missingClientUrl() : errors.invalidBarcode(barcode);

                }, 0);
            },

            /** @function methods.get.formattedOffers
             * Groups same valid offers in an array
             * @param loyaltyObj - The LoyaltyObject returned by the api
             * @returns {Array} */
            formattedOffers: function (loyaltyObj) {
                var offers = loyaltyObj.Offers;
                $log.info('offers', offers);
                var offersTypes = [];

                for (var i = 0; i < offers.length; i++) {
                    if (offers[i].isValid)
                        offersTypes.push(offers[i]);
                }
                return offersTypes;
            },

            /** @function methods.get.emptyPassageObj
             *  Returns a LoyaltyOrderRequest object with empty properties */
            emptyPassageObj: function () {
                return {
                    "Login": null,
                    "Password": null,
                    "Key": null,
                    "Barcode": vars.currLoyaltyObject.Barcodes[0].Barcode,
                    "CustomerFirstName": vars.currLoyaltyObject.CustomerFirstName,
                    "CustomerLastName": vars.currLoyaltyObject.CustomerLastName,
                    "CustomerEmail": vars.currLoyaltyObject.CustomerEmail,
                    "OrderTotalIncludeTaxes": 0,
                    "OrderTotalExcludeTaxes": 0,
                    "CurrencyCode": "EUR",
                    "Items": [],
                    "BalanceUpdate": {},
                    "OrderSpecificInfo": "2"
                };
            }
        },

        actions: {
            /** @function methods.actions.useOffer
             *  @param offer_id = the OfferId property of the offer to use
             *  @param offer_barcode = the Barcode property of the offer to use */
            useOffer: function (offer_id, offer_barcode) {
                if (methods.validate.barcode(offer_barcode)) {
                    var passageObj = methods.get.emptyPassageObj();
                    passageObj.Offer = {
                        "OfferObjectId": offer_id,
                        "Barcode": offer_barcode,
                        "Date": new Date()
                    };
                    return methods.actions.addPassage(passageObj);
                } else {
                    return false;
                }
            },

            /* @todo: @function useAvoir */
            useAvoir: function (balance_id, amount) {
                var passageObj = methods.get.emptyPassageObj();
                passageObj.BalanceUpdate = {
                    "Id": balance_id,
                    "UpdateValue": amount
                };
            },

            addPassage: function (obj) {
                console.log(obj);
                console.log(passagePromise);
                passagePromise = null;
                if (!passagePromise) {
                    passagePromise = $http.post(methods.get.callableUrl("AddPassage"), JSON.stringify(JSON.stringify(obj))).success(function (data) {
                        return data;
                    });
                    return passagePromise;
                }
            },

            addOrder: function (obj) {
                console.log(obj);
                console.log(passagePromise);
                passagePromise = null;
                if (!passagePromise) {
                    passagePromise = $http.post(methods.get.callableUrl("AddOrder"), JSON.stringify(JSON.stringify(obj))).success(function (data) {
                        return data;
                    });
                    return passagePromise;
                }
            },

            register: function (formObj) {
                return $timeout(function () {
                    return vars.fake ? fakeData : $http.post(methods.get.callableUrl("Register"), JSON.stringify(JSON.stringify(formObj))).success(function (data) {
                        vars.currLoyaltyObject = data;
                        return data;
                    });
                }, 0);
            }
        },

        /** Methods to validate user input */
        validate: {
            /** @function methods.validate.clientUrl
             * Checks if the clientUrl matches one of the correct urls in vars.validClientUrls */
            clientUrl: function () {
//                return !!~vars.validClientUrls.indexOf(vars.clientUrl);
                return true;
            },

            /** @function methods.validate.barcode
             * Checks if the barcode is a number containing either 8 or 10 characters (8 = legacy, 10 = new) or a valid email address
             * It tests three RegExps in one:
             * (^[0-9]{8,8}$) -> An int or a string containing exactly 8 numbers
             * (^[0-9]{10,10}$) -> An int or a string containing exactly 10 numbers
             * (^[_a-z0-9]+(\.[_a-z0-9]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})$)/) -> A valid email address (with the TLD forced, while the standard spec accepts TLD-less adresses)
             * */
            barcode: function (barcode) {
//                return new RegExp(/(^[0-9]{8,8}$)|(^[0-9]{10,10}$)|(^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})$)/).test(barcode);
                return true;
            }
        }
    };

    /** fake LoyaltyObject for testing */
    emptyData = {
        "Barcodes": [],
        "LoyaltyObjectId": 0,
        "CustomerId": 0,
        "LoyaltyClass": null,
        "CustomerFirstName": null,
        "CustomerLastName": null,
        "CustomerEmail": null,
        "Balances": [],
        "Offers": []
    };

    fakeData = emptyData;

    /** return the exposed API methods */
    return methods;
}]);