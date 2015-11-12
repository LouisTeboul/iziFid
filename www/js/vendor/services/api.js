'use strict';

angular.module('APIServiceApp', []).factory('APIService', ['$http', '$log', '$timeout', function ($http, $log, $timeout) {
    var methods, vars, errors, fakeData, emptyData, passagePromise = null;

    /** Variables & flags
     * @variable endpoint [type: string] : the API endpoint, without domain name and params
     * @variable clientUrl [type: string] : the domain name of the partner we want to hit (e.g: http://pitapit.fr)
     * @variable fake [type: boolean] : whether this service should mock API calls by serving fake JSON data for debugging
     * @variable debug [type: boolean] : Turns logging ON/OFF
     */
    vars = {
        endpoint: "/api/RESTLoyalty/RESTLoyalty/",
        clientUrl: "",
        fake: false,
        debug: true,
        currLoyaltyObject: {}
    };

    /** Shortcut functions for throwing the various possible errors */
    errors = {
        /** @function missingClientUrl
         *  The error to throw in case 'vars.clientUrl' is not defined */
        missingClientUrl: function () {
            return vars.debug ? $log.error("Client URL is not set! Use APIService.set.clientUrl(xxx)") : 0;
        },

        /** @function missingClientUrl
         *  The error to throw in case the barcode param is not valid (= not 8 characters long and/or not a number)
         *  @param barcode [type: number]
         *  The barcode we want to get the data from */
        invalidBarcode: function (barcode) {
            return vars.debug ? $log.error("Barcode is not valid:", barcode) : 0;
        },

        notLoggedIn: function () {
            return vars.debug ? $log.error("No client logged in") : 0;
        },

        addPassage: function () {
            return vars.debug ? $log.error("AddPassage ERROR, API returned false.") : 0;
        }
    };

    /** Methods exposed by the service's API */
    methods = {
        set: {
            /** @function methods.set.clientUrl(@param url)
             *  Sets the client url. See 'vars.clientUrl' above
             *  @params url [type: string]
             *  the client's website url */
            clientUrl: function (url) {
                vars.clientUrl = url;
            },

            /** @function methods.set.endpoint(@param endpoint)
             *  Sets the API endpoint. See 'vars.endpoint' above
             *  @params endpoint [type: string]
             *  the API's endpoint path without the url (= after the TLD) */
            endpoint: function (endpoint) {
                vars.endpoint = endpoint;
            },

            /** @function methods.set.debug
             *  Allows to toggle debug mode (= logging in the console) on & off
             *  @params bool [type: boolean]
             *  Self-explanatory */
            debug: function (bool) {
                vars.debug = !!bool;
            },

            /** @function methods.set.fake
             *  If set to true, we will use the fake data below for testing instead of actually calling the API
             *  @params bool [type: boolean]
             *  Self-explanatory */
            fake: function (bool) {
                vars.fake = !!bool;
            }
        },

        get: {
            /** @function methods.get.callableUrl
             *  Returns the complete url to call an API method from the client url, the endpoint and the parameters
             *  @param params [type: string]
             *  The URL parameters to pass to the endpoint (e.g: '?barcode=12345678') */
            callableUrl: function (params) {
                return methods.validate.clientUrl() ? vars.clientUrl + vars.endpoint + params : errors.missingClientUrl();
            },

            emptyData: function () {
                return emptyData;
            },

            /**
             * @function methods.get.debugState
             * Returns true if debugging is enabled
             * @returns {boolean}
             */
            debugState: function () {
                return vars.debug;
            },

            serverUrl: function (uuid) {
                if (!vars.clientUrl) vars.clientUrl = 'http://ffpizza.izipass.pro';
                $http.get(methods.get.callableUrl("GetServerUrl?Hardware_Id=" + uuid)).success(function (data) {
                    $log.info('getServerUrl', data);
                    if (!data.Server_Url) alert("Cet appareil n'est pas relié à la fidélité");
                    methods.set.clientUrl(data['Server_Url']);
                }).error(function (e) {
                    vars.debug ? $log.error(e) : 0;
                });
            },

            /** @function methods.get.loyaltyObject(@param barcode)
             *  Get the data associated with a particular barcode
             * @param barcode [type: number]
             * The barcode we want to retrieve data from
             * @param func [type: function]
             * A callback function to which we pass the data */
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

            formattedOffers: function (loyaltyObj) {
                var offers = loyaltyObj.Offers;
                $log.info('offers', offers);
                var offersTypes = [];

                if (offers) {
                    /** Group valid offers by OfferTypeId */
                    for (var i = 0; i < offers.length; i++) {
                        if (offers[i].isValid)
                            offersTypes.push(offers[i]);
                    }
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

            useVoucherOffer: function (offer_class_id) {
                passagePromise = null;
                if (!passagePromise) {
                    passagePromise = $http.post(methods.get.callableUrl("UseOffer"), JSON.stringify(JSON.stringify({"OfferClassId": offer_class_id}))).success(function (data) {
                        return data;
                    });
                    return passagePromise;
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

            register: function (formObj) {
                return $timeout(function () {
                    return $http.post(methods.get.callableUrl("Register"), JSON.stringify(JSON.stringify(formObj))).success(function (data) {
                        vars.currLoyaltyObject = data;
                        return data;
                    });
                }, 0);
            },

            registerAnonymous: function (formObj) {
                return $timeout(function () {
                    return $http.post(methods.get.callableUrl("RegisterAnonymous"), JSON.stringify(JSON.stringify(formObj))).success(function (data) {
                        vars.currLoyaltyObject = data;
                        return data;
                    });
                }, 0);
            },

            resetPassword: function (barcode) {
                return $http.get(methods.get.callableUrl("GetNewPassword") + "?barcode=" + barcode).then(function (data) {
                    return data;
                }).catch(function (err) {
                    console.log(err);
                });
            },

            searchForCustomer: function (query) {
                return $http.get(methods.get.callableUrl("GetSearchCustomer") + "?searchString=" + query).then(function (data) {
                    return data;
                }).catch(function (err) {
                    console.log(err);
                });
            }
        },

        /** Methods to validate user input */
        validate: {
            /** @function methods.validate.clientUrl
             * Checks if the clientUrl matches one of the correct urls in vars.validClientUrls */
            clientUrl: function () {
            // return !!~vars.validClientUrls.indexOf(vars.clientUrl);
                return true;
            },

            /** @function methods.validate.barcode
             * Checks if the barcode is a number containing either 8 or 10 characters (8 = legacy, 10 = new) */
            barcode: function (barcode) {
                return !!((+barcode && ~[8, 10].indexOf(barcode.toString().length)) || new RegExp(/(^[0-9]*$)|(^[_a-z0-9]+(\.[_a-z0-9]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})$)/));
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