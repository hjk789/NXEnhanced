
// Make it so that when the user uninstalls the extension, an anonymous survey is opened to let the user provide what was the reason for uninstalling it.

if (typeof browser == "undefined")
    chrome.runtime.setUninstallURL("https://docs.google.com/forms/d/e/1FAIpQLSerqdyPLBpBqr1kRfD9FtIdiEYupWsnODHTmPHyR14DwxX-DA/viewform")
else
    browser.runtime.setUninstallURL("https://docs.google.com/forms/d/e/1FAIpQLSerqdyPLBpBqr1kRfD9FtIdiEYupWsnODHTmPHyR14DwxX-DA/viewform")