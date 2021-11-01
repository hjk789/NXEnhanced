# NX Enhanced
A userscript that adds "quality-of-life" features to NextDNS website to make the experience of managing lists, domains, etc. more practical.

**NOTE:** This userscript is **DISCONTINUED** and **OUTDATED**, please use the browser extension version instead if you want to continue receiving updates (instructions [here](https://github.com/hjk789/NXEnhanced)). The last time it was tested, the userscript was still working fine in Chrome, and partially in Firefox (see the "How to use it" note below). 

## Features

### Logs page:

- Allow/Deny buttons in the logs that make it possible to add an exception or block a domain without needing to copy, switch pages, and paste.   
![Allow and Deny butttons](https://i.imgur.com/3XNMUi1.png)    
You can either add the respective domain or the whole root domain, or even edit the domain if you want.   
[Read more](https://github.com/hjk789/NXEnhanced/wiki#an-allowdeny-button-for-each-log-entry)

- Option to show only queries from unnamed devices   
![Other Devices button](https://i.imgur.com/V7HFiJL.png)      

- Ability to specify domains that should be hidden from the logs  
![New domain filtering for the logs](https://i.imgur.com/l8Ouzh1.png)        
You can either manually input domains, or click on the "Hide" button, alongside the Allow/Deny buttons, which lets you hide domains with few clicks.  [Read more](https://github.com/hjk789/NXEnhanced/wiki#ability-to-specify-domains-that-should-be-hidden-from-the-logs)

- Show the query's absolute time (HH:MM:SS) along with the relative time ("a minute ago", "few seconds ago")   
![Absolute time](https://i.imgur.com/I3pGNL8.png)    

- A refresh button    
![refresh button](https://i.imgur.com/yBEo3mV.png)

- An option to show the number of entries currently loaded, either visible or hidden by filters    
![counters](https://i.imgur.com/8mTEDt1.png)

### Privacy page:

- Collapse the list of blocklists enabled and adds a button to unhide them if needed    
![Hidden lists](https://i.imgur.com/ifnmNiv.png)    
This is good for people with a long list of blocklists added.

- Sort alphabetically the list of blocklists in the "Add a blocklist" screen  
![Sort a-z blocklists](https://i.imgur.com/rFXduAY.png)    

### Security page:

- Collapse the list of added TLDs

- A button that allows you to add every TLD in the "Add a TLD" screen in one click. [Read more](https://github.com/hjk789/NXEnhanced/wiki#a-button-that-allows-you-to-add-every-tld-in-the-add-a-tld-screen-in-one-click)   
![Add all TLDs button](https://i.imgur.com/PDlYlF1.png)     

### Allowlist/Denylist pages:

- Ability to add a description to each domain in the allow/denylists. [Read more](https://github.com/hjk789/NXEnhanced/wiki#ability-to-add-a-description-to-each-domain-in-the-denyallow-lists)   
![Description input](https://i.imgur.com/TqlKWxr.png)    

- Sort the allow/deny lists alphabetically, and styling options to the domains for an easier quick reading, such as: lighten subdomains, bold root domain and right-align.   
![allow/deny options](https://i.imgur.com/DiuO5TB.png)

### Settings page:

- Ability to export/import all settings from/to a config. [Read more](https://github.com/hjk789/NXEnhanced/wiki#ability-to-exportimport-all-settings-fromto-a-config)   
![Export/import buttons](https://i.imgur.com/2oEl8t2.png)    


## How to use it

To use this userscript, just install in your browser Tampermonkey, Violentmonkey or Greasemonkey extension, if you hadn't yet. Having it installed, then just go to the following link: https://greasyfork.org/scripts/408934-nx-enhanced/code/NX%20Enhanced.user.js

A window will pop asking if you want to install the script, just confirm it, and it's done! 

If you use uMatrix, you have to allow **media** to `api.nextdns.io` to use the allow/deny buttons, Add all TLDs and export/import features.

**Note:** Although almost all features should work fine with it, Greasemonkey is not supported. NX Enhanced userscript was tested in Firefox and Chrome, in Tampermonkey, Greasemonkey and Violentmonkey. It used to work in Firefox, but it's working partially now. You have to use the [Firefox extension](https://addons.mozilla.org/addon/nx-enhanced?utm_source=github&utm_content=userscript) instead. If you really have to use this userscript in Firefox, you have to disable the `security.csp.enable` setting in about:config (not recommended for security reasons). In Chrome, the last time it was tested it still worked fine. It should work fine in pretty much any other browsers in which you can install any of these three script-managers, although I didn't tested them.

## License

- You can view the code, download copies, install, run, use the features and uninstall this software.
- You can link to this project's repository homepage (https://github.com/hjk789/NXEnhanced). 
- You can modify your downloaded copy as you like.
- You can make a fork of this project, provided that: 1. You fork it inside GitHub, by clicking on the "Fork" button of this project's repository web page; and 2. You fork it in order to push changes to this project's repository with a pull request. If you don't fit in these conditions, don't fork it.
- You cannot do any other action not allowed in this license.  

I have no association with NextDNS Inc., I'm just a user of their DNS service who needed the features NX Enhanced provides. NX Enhanced is a completely voluntary work. I am not responsible for any damage or leak, directly or indirectly related to the use or misuse of this software. The responsibility is completely on it's users. Use it at your own risk. There are no warranties, either implied or stated.

Copyright (c) 2020+ BLBC ([hjk789](https://github.com/hjk789))
