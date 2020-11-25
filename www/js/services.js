starterApp.service('appServices', function appServices($q,dialogs) {
        // Wrap the barcode scanner in a service so that it can be shared easily.
        this.scanBarcode = function () {
            // The plugin operates asynchronously so a promise
            // must be used to display the results correctly.
            var deferred = $q.defer();
            try {
                cordova.plugins.barcodeScanner.scan(
                    function (result) {  // success
                        deferred.resolve({'error': false, 'result': result});
                    },
                    function (error) {  // failure
                        deferred.resolve({'error': true, 'result': error.toString()});
                    }
                );
            }
            catch (exc) {
                //deferred.resolve({'error': true, 'result': 'exception: ' + exc.toString()});
                dialogs.show("QRCodeDialog").then(function (result) {
                    var resText = { text: result };
                    deferred.resolve({ 'error': false, 'result': resText });
                }, function () {
                    deferred.resolve({ 'error': true, 'result': 'No barcode' });
                });
            }
            return deferred.promise;
        };
    });
