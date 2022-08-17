if (typeof browser == "undefined")
    browser = chrome

browser.runtime.onInstalled.addListener((event)=>
{
    if (event.reason == "update")
        browser.tabs.create({url: "/releaseNotes.html"})
})