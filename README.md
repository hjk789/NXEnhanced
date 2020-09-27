# NX Enhanced
A userscript that adds "quality-of-life" features to NextDNS website to make the experience of managing lists, domains, etc. more practical.

## Current features

### Logs page:

- Allow/Deny buttons in the logs that make it possible to add an exception or block a domain without needing to copy, switch pages, and paste.   
![Allow and Deny butttons](https://i.imgur.com/3XNMUi1.png)    
You can either add the respective domain or the whole root domain, or even edit the domain if you want.   
[Read more](https://github.com/hjk789/NXEnhanced/wiki#an-allowdeny-button-for-each-log-entry)

- Hide those Chrome based browsers' randomly generated domains queries (like `vkpwqcakgflqeq`, `lfujniwzrouh`, etc.)

- Option to show only queries from unnamed devices   
![Other Devices button](https://i.imgur.com/V7HFiJL.png)      

- Ability to specify domains that should be hidden from the logs 
![New domain filtering for the logs](https://i.imgur.com/cdbwwaJ.png)        
You can either manually input domains, or click on the "Hide" button, alongside the Allow/Deny buttons, which lets you hide domains with few clicks.  [Read more](https://github.com/hjk789/NXEnhanced/wiki#ability-to-specify-domains-that-should-be-hidden-from-the-logs)

- Show the query's absolute time (HH:MM:SS) along with the relative time ("a minute ago", "few seconds ago")   
![Absolute time](https://i.imgur.com/I3pGNL8.png)    

- A refresh button    
![refresh button](https://i.imgur.com/yBEo3mV.png)

- An option to show the number of entries currently loaded, either visible or hidden by filters    
![counters](https://i.imgur.com/jj9Cbp2.png)

### Privacy page:

- Hide the list of blocklists enabled and adds a button to unhide them if needed    
![Hidden lists](https://i.imgur.com/JQ4JOdN.png)    
This is good for people with a long list of blocklists added.

- Sort alphabetically the list of blocklists in the "Add a blocklist" screen

### Security page:

- Hide the list of added TLDs. It behaves the exact same way as the one in the Privacy page.

- A button that allows you to add every TLD in the "Add a TLD" screen in one click. [Read more](https://github.com/hjk789/NXEnhanced/wiki#a-button-that-allows-you-to-add-every-tld-in-the-add-a-tld-screen-in-one-click)   
![Add all TLDs button](https://i.imgur.com/PDlYlF1.png)     

### Allowlist/Denylist pages:

- Ability to add a description to each domain in the allow/denylists. [Read more](https://github.com/hjk789/NXEnhanced/wiki#ability-to-add-a-description-to-each-domain-in-the-denyallow-lists)   
![Description input](https://i.imgur.com/TqlKWxr.png)    

- A button to sort the allow/deny lists alphabetically   
![Sort A-Z](https://i.imgur.com/gKWSagQ.png)    

- Styling options to the domains for an easier quick reading, such as: lighten subdomains, bold root domain and right-align.   
![Stylish domains](https://i.imgur.com/czNmQqB.png)
![Styling options](https://i.imgur.com/Iiernta.png)

### Settings page:

- Ability to export/import all settings from/to a config. [Read more](https://github.com/hjk789/NXEnhanced/wiki#ability-to-exportimport-all-settings-fromto-a-config)   
![Export/import buttons](https://i.imgur.com/2oEl8t2.png)    


## How to use it

To use this userscript, just install in your browser TamperMonkey (Chrome and Firefox), GreaseMonkey (Firefox) or ViolentMonkey (Chrome and Firefox) extension, if you hadn't yet. Having it installed, then just go to the following link: https://greasyfork.org/scripts/408934-nx-enhanced/code/NX%20Enhanced.user.js

A window will pop asking if you want to install the script, just confirm it, and it's done! 

If you use uMatrix, you have to allow **media** to `api.nextdns.io` to use the allow/deny buttons, Add all TLDs and export/import features.

On mobile, only Firefox Mobile has support for userscripts. The procedure is the same, install TamperMonkey/GreaseMonkey/ViolentMonkey and then install the userscript. However, keep in mind that NX Enhanced isn't optimized for mobile yet.

**Note:** Although almost all features should work fine with it, GreaseMonkey is not supported. I recommend that you avoid using it if you don't have a reason that forces you to use only GreaseMonkey. GreaseMonkey 4 is quite buggy and lacks many features that TamperMonkey has. You can use NX Enhanced in GreaseMonkey, but keep in mind that I won't make big efforts to make NX Enhanced compatible with it.    
NX Enhanced was tested in Firefox and Chrome, in TamperMonkey and in GreaseMonkey, running perfectly in TamperMonkey, and with a few little bugs in GreaseMonkey. It should work fine in ViolentMonkey and pretty much any browser in which you can install any of these three script-managers, though I didn't tested them.

## Bug reports and suggestions

Although it's a work in progress, this userscript is completely usable at the current state, but there might be some situations where an unnoticed bug might get noticed. In these cases, please report it posting an issue on the [issues section](https://github.com/hjk789/NXEnhanced/issues). If you want to suggest more features, you can freely do it there too.

## Support

This project takes a lot of time and effort developing, analyzing, testing, fixing, researching and optimizing, most of these are because it's being developed for public use, instead of just my personal use. If you appreciate this project, would like to give a thank you or support the continuation of the development, you can make a donation via PayPal:

[![Donate with PayPal](https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=CK5BFYUP9TWBJ&source=url)

## Disclaimers

I have no association with NextDNS Inc., I'm just a user of their service. NX Enhanced is a completely voluntary work. I am not responsible for any damage or leak, directly or indirectly related to the use of this software. The responsibility is completely on it's users. Use it at your own risk. There are no warranties, either implied or stated.

## License

- You can view the code, download copies and run this software as is.
- You can suggest changes, either by opening issues or by doing pull requests. 
- You can participate in discussions or comment/opinate about new features.
- You can link to this project's repository homepage (https://github.com/hjk789/NXEnhanced). 
- You can modify your copy as you like, although it's recommended that you suggest this modification to be included in the original, so all users can benefit.
- You cannot do any other action not allowed in this license.  

Copyright (c) 2020 BLBC ([hjk789](https://github.com/hjk789))
