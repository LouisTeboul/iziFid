angular.module('fid.services', []).service('barcodeService', function barcodeService($q) {
    this.scanBarcode = function () {
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
            deferred.resolve({'error': true, 'result': 'exception: ' + exc.toString()});
        }
        return deferred.promise;
    };
});
