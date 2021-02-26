
// Detect page switchings

browser.tabs.onUpdated.addListener(function(tabId) {
    browser.tabs.sendMessage(tabId, {pageSwitched: true})
}, { urls: [ "https://my.nextdns.io/*" ], properties: [ "title" ] })
