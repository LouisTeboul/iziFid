starterApp.provider('dialogs', function () {
	var dialogs = [];

	this.addDialog = function (name, options) {
		dialogs.push({
			name: name,
			options: options
		});
	};

	this.$get = function ($mdDialog) {
		var self = this;
		return {
			show: function (name, args) {
				var dialog = Enumerable.from(dialogs).firstOrDefault(function (x) { return x.name === name; });
				if (dialog) {
					dialog.options.locals = {
						args: args
					};

					return $mdDialog.show(dialog.options);
				}
			}
		};
	};
});