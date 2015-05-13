angular.module('starter.services', [])

    .service('appServices', function appServices($q) {
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
                deferred.resolve({'error': true, 'result': 'exception: ' + exc.toString()});
            }
            return deferred.promise;
        };
    })

    .factory('Chats', function () {
        // Might use a resource here that returns a JSON array

        // Some fake testing data
        var chats = [
            {
                id: 0,
                name: 'Ben Sparrow',
                lastText: 'You on your way?',
                face: 'https://pbs.twimg.com/profile_images/514549811765211136/9SgAuHeY.png'
            },
            {
                id: 1,
                name: 'Max Lynx',
                lastText: 'Hey, it\'s me',
                face: 'https://avatars3.githubusercontent.com/u/11214?v=3&s=460'
            },
            {
                id: 2,
                name: 'Adam Bradleyson',
                lastText: 'I should buy a boat',
                face: 'https://pbs.twimg.com/profile_images/479090794058379264/84TKj_qa.jpeg'
            },
            {
                id: 3,
                name: 'Perry Governor',
                lastText: 'Look at my mukluks!',
                face: 'https://pbs.twimg.com/profile_images/491995398135767040/ie2Z_V6e.jpeg'
            },
            {
                id: 4,
                name: 'Mike Harrington',
                lastText: 'This is wicked good ice cream.',
                face: 'https://pbs.twimg.com/profile_images/578237281384841216/R3ae1n61.png'
            }
        ];

        return {
            all: function () {
                return chats;
            },
            remove: function (chat) {
                chats.splice(chats.indexOf(chat), 1);
            },
            get: function (chatId) {
                for (var i = 0; i < chats.length; i++) {
                    if (chats[i].id === parseInt(chatId)) {
                        return chats[i];
                    }
                }
                return null;
            }
        };
    });
