/***********************************************************
XPCOM
***********************************************************/

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
Components.utils.import("resource://gre/modules/AddonManager.jsm");

// When the user decides to disable or uninstall the add-on, reset the
// autoplay setting immediately, instead of waiting for application shutdown.
// In button.js we check the status of the add-on, and prevent the user from
// turning the override back on if the extension is going to be uninstalled or
// disabled.
AddonManager.addAddonListener({
	onUninstalling: function(addon) {
		if (addon.id == "autoplay-toggle@lakora.us") {
			var prefs = Components.classes["@mozilla.org/preferences-service;1"]
				.getService(Components.interfaces.nsIPrefService)
				.getBranch("media.autoplay.")
			prefs.setBoolPref("enabled", true);
			prefs.setBoolPref("allowscripted", true);
		}
	},
	onDisabling: function(addon) {
		if (addon.id == "autoplay-toggle@lakora.us") {
			var prefs = Components.classes["@mozilla.org/preferences-service;1"]
				.getService(Components.interfaces.nsIPrefService)
				.getBranch("media.autoplay.")
			prefs.setBoolPref("enabled", true);
			prefs.setBoolPref("allowscripted", true);
		}
	}
});

/***********************************************************
class definition
***********************************************************/

//class constructor
function AutoplayToggle() { }

// class definition
AutoplayToggle.prototype = {

	// properties required for XPCOM registration:
	classDescription: "Autoplay Toggle (Non-Restartless)",
	classID:		  Components.ID("{46836316-e11d-4142-b83b-c1e99755b6e2}"),
	contractID:	   "@propfire/startup;1",
	QueryInterface:   XPCOMUtils.generateQI([Components.interfaces.nsIObserver]),

	// add to category manager
	_xpcom_categories: [{category: "profile-after-change"}],
	
	prefBranch: null,
	
	getString: s => {
		var strings = Components.classes["@mozilla.org/intl/stringbundle;1"]
			.getService(Components.interfaces.nsIStringBundleService)
			.createBundle("chrome://autoplay-toggle/locale/autoplay-toggle.properties");
		try {
			return strings.GetStringFromName(s);
		} catch (e) {
			return "?";
		}
	},

	observe: function(aSubject, aTopic, aData)
	{
		switch (aTopic) 
		{
			case "profile-after-change":
				// Set up listeners for the cases below.
				Components.classes["@mozilla.org/observer-service;1"]
					.getService(Components.interfaces.nsIObserverService)
					.addObserver(this, "quit-application", false);
						
				this.prefBranch = Components.classes["@mozilla.org/preferences-service;1"]
					.getService(Components.interfaces.nsIPrefService)
					.getBranch("media.autoplay.");
				this.prefBranch.addObserver("", this, false);
				break;
			case "nsPref:changed":
				var strings = Components.classes["@mozilla.org/intl/stringbundle;1"]
					.getService(Components.interfaces.nsIStringBundleService)
					.createBundle("chrome://autoplay-toggle/locale/autoplay-toggle.properties");
					
				// Determine which message to show to the user.
				var title = strings.GetStringFromName("title");
				var newValue = Components.classes["@mozilla.org/preferences-service;1"]
					.getService(Components.interfaces.nsIPrefService)
					.getBranch("media.autoplay.")
					.getBoolPref(aData);
				
				var message = strings.GetStringFromName(newValue ? "turnedOn" : "turnedOff");

				var type = Components.classes["@mozilla.org/preferences-service;1"]
					.getService(Components.interfaces.nsIPrefService)
					.getBranch("extensions.autoplay-toggle.")
					.getCharPref("notify-type");
				switch (type) {
					case "non-modal":
						// Use nsIAlertsService to show a notification.
						// If you want the native Windows 10 notifications you
						// can use the GNotifier add-on along with this one.
						try {
							Components.classes['@mozilla.org/alerts-service;1']
								.getService(Components.interfaces.nsIAlertsService)
								.showAlertNotification(null, title, message, false, '', null);
						} catch (e) {
							Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
								.getService(Components.interfaces.nsIPromptService)
								.alert(null, title, message);
						}
						break;
					case "none":
						// User has decided not to show a notification.
						break;
					default:
						// Use nsIPromptService to show an old-fashioned modal dialog.
						try {
							Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
								.getService(Components.interfaces.nsIPromptService)
								.alert(null, title, message);
						} catch (e) {
							Components.classes['@mozilla.org/alerts-service;1']
								.getService(Components.interfaces.nsIAlertsService)
								.showAlertNotification(null, title, message, false, '', null);
						}
						break;
				}
				break;
			default:
				throw Components.Exception("Unknown topic: " + aTopic);
		}
	}
};

var components = [AutoplayToggle];  
if (XPCOMUtils.generateNSGetFactory)
{
	var NSGetFactory = XPCOMUtils.generateNSGetFactory(components);
}
else
{
	var NSGetModule = XPCOMUtils.generateNSGetModule(components);
}

