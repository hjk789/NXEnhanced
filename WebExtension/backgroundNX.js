
// Detect page switchings

if (typeof browser == "undefined")                              // If it's Chrome or Opera.
{
    chrome.tabs.onUpdated.addListener(function(tabId) {
        chrome.tabs.sendMessage(tabId, {pageSwitched: true})
    })
}
else                                                            // If it's Firefox or Edge.
{
    browser.tabs.onUpdated.addListener(function(tabId) {
        browser.tabs.sendMessage(tabId, {pageSwitched: true})
    }, { urls: [ "https://my.nextdns.io/*" ], properties: [ "title" ] })
}