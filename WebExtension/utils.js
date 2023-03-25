const isChrome = typeof browser == "undefined"              // Whether it's Chrome. Chrome uses the chrome object, while Firefox and Edge use the browser object.

if (isChrome)
    chrome.storage.onChanged.addListener(loadNXsettings)
else
    browser.storage.onChanged.addListener(loadNXsettings)


function loadNXsettings()
{
    return new Promise(resolve =>
    {
        readSetting("NXsettings", function(obj)
        {
            if (!obj.NXsettings)        // If it's running for the first time, store the following default settings.
            {
                NXsettings =
                {
                    SecurityPage: { CollapseList: true },
                    PrivacyPage:
                    {
                        CollapseList: true,
                        SortAZ: false
                    },
                    AllowDenylistPage:
                    {
                        SortAZ: false,
                        SortTLD: false,
                        Bold: false,
                        Lighten: false,
                        RightAligned: false,
                        MultilineTextBox: false,
                        DomainsDescriptions: {}     // In Chrome it's required to be an object to use named items. In Firefox it works even with an array, but with some bugs.
                    },
                    LogsPage:
                    {
                        ShowCounters: false,
                        DomainsToHide: ["nextdns.io", ".in-addr.arpa", ".ip6.arpa"]
                    }
                }

                saveSettings(NXsettings)
            }
            else NXsettings = obj.NXsettings

            resolve()
        })
    })
}

function saveSettings(object)
{
    if (!object)  object = NXsettings

    if (isChrome)
        chrome.storage.local.set({NXsettings: object})
    else
        browser.storage.local.set({NXsettings: object})
}

function readSetting(settingName, callback)
{
    if (isChrome)
        chrome.storage.local.get(settingName, callback)
    else
        browser.storage.local.get(settingName).then(callback)
}