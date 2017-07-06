/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var prefs = null;
var observerObj = null;

this.addEventListener("load", function () {
	prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("media.navigator.permission.");
	var toolbarbutton = document.getElementById("autoplay-toggle-ui-toggle-1");

	observerObj = {
		observe: function (aSubject, aTopic, aData) {
			if ("nsPref:changed" == aTopic) {
				var newValue = aSubject.getBoolPref(aData);

				if (newValue) {
					toolbarbutton.label = toolbarbutton.tooltipText = AutoplayToggleButtons.GetString("overrideOn");
					toolbarbutton.classList.add("setting-true");
				} else {
					toolbarbutton.label = toolbarbutton.tooltipText = AutoplayToggleButtons.GetString("overrideOff");
					toolbarbutton.classList.remove("setting-true");
				}
			}
		}
	};
	
	prefs.addObserver("", observerObj, false);

	var value = prefs.getBoolPref("disabled");
	if (value) {
		toolbarbutton.label = toolbarbutton.tooltipText = AutoplayToggleButtons.GetString("overrideOn");
		toolbarbutton.classList.add("setting-true");
		
		var r = Components.classes["@mozilla.org/preferences-service;1"]
					.getService(Components.interfaces.nsIPrefService)
					.getBranch("extensions.autoplay-toggle.")
					.getBoolPref("reset-on-new-window");
		if (r) {
			prefs.setBoolPref("disabled", false);
		}
	} else {
		toolbarbutton.label = toolbarbutton.tooltipText = AutoplayToggleButtons.GetString("overrideOff");
	}
});
this.addEventListener("unload", function () {
	prefs.removeObserver("", observerObj);
});

AutoplayToggleButtons = {
	GetString: s => {
		var strings = Components.classes["@mozilla.org/intl/stringbundle;1"]
			.getService(Components.interfaces.nsIStringBundleService)
			.createBundle("chrome://autoplay-toggle/locale/autoplay-toggle.properties");
		try {
			return strings.GetStringFromName(s);
		} catch (e) {
			if ("console" in window) window.console.log(e);
			return "?";
		}
	},
	Toggle: () => {
		var title = AutoplayToggleButtons.GetString("title");
		AddonManager.getAddonByID("autoplay-toggle@lakora.us", addon => {
			var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
				.getService(Components.interfaces.nsIPromptService);
				
			if (addon.pendingOperations & (AddonManager.PENDING_DISABLE | AddonManager.PENDING_UNINSTALL)) {
				promptService.alert(this.window, title, AutoplayToggleButtons.GetString("enableOrReinstallRequired"));
			} else {
				var actualValue = prefs.getBoolPref("disabled");
				if (actualValue) {
					prefs.setBoolPref("disabled", false);
				} else if (promptService.confirm(this.window, title, AutoplayToggleButtons.GetString("confirmationPromptMessage"))) {
					prefs.setBoolPref("disabled", true);
				}
			}
		});
	}
}