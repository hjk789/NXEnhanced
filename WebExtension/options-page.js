
(async ()=>
{
    // Load all NX Enhanced's settings. All these functions are imported from the utils.js script.
    await loadNXsettings()

    const settings =
    [
        ["collapseListTLDs",       "SecurityPage",      "CollapseList"],
        ["collapseListBlocklists", "PrivacyPage",       "CollapseList"],
        ["sortAZblocklists",       "PrivacyPage",       "SortAZ"],
        ["sortAZdomains",          "AllowDenylistPage", "SortAZ"],
        ["sortTLDs",               "AllowDenylistPage", "SortTLD"],
        ["bold",                   "AllowDenylistPage", "Bold"],
        ["lighten",                "AllowDenylistPage", "Lighten"],
        ["rightAligned",           "AllowDenylistPage", "RightAligned"],
        ["multilineTextBox",       "AllowDenylistPage", "MultilineTextBox"],
        ["showCounters",           "LogsPage",          "ShowCounters"]
    ]

    for (let i=0; i < settings.length; i++)
    {
        const settingFields = settings[i]

        const checkbox = document.getElementById(settingFields[0])
        checkbox.checked = NXsettings[settingFields[1]][settingFields[2]]                                                 // Display the current settings values.
        checkbox.onchange = function() { NXsettings[settingFields[1]][settingFields[2]] = this.checked; saveSettings() }     // Save the settings when changed.
    }


    const domainsToHide = document.getElementById("domainsToHide")
    domainsToHide.value = NXsettings.LogsPage.DomainsToHide.join("\n")
    domainsToHide.onchange = function() { NXsettings.LogsPage.DomainsToHide = this.value.split("\n"); saveSettings() }

})()
