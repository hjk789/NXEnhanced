# NX Enhancer
A userscript that adds "quality-of-life" features to NextDNS website to make the experience of managing lists, domains, etc. more practical.

## Current features

### Logs page:

- An Allow/Deny button in the logs that make it possible to add an exception or block a domain without needing to copy, switch pages, and paste.   
![Allow and Deny butttons](https://i.imgur.com/y8EsZ1V.png)    
When clicked, it pops a small view of the Allowlist/Denylist pages and auto fills the input field with the domain respective to the button clicked, allowing you to edit the domain name if you want, and when finished, just confirm. 

- Hide those Chrome based browsers' randomly generated domains queries (like `vkpwqcakgflqeq`, `lfujniwzrouh`, etc.)

- Option to show only queries from unnamed devices.   
![Other Devices button](https://i.imgur.com/V7HFiJL.png)      

- Ability to specify domains that should be hidden from the logs. It comes with a "Filters" button that, when clicked, show the list of domains currently set to be hidden.  
![New domain filtering for the logs](https://i.imgur.com/7kLbdaN.png)        
You can either manually type (or paste) domains, or click on the new "Hide" button, alongside the Allow/Deny buttons, which lets you hide domains with one click. If you want to edit the domain, just click on the "Filters" button, edit the domain and click "OK". By default, it hides **\*.nextdns.io** and **\*.arpa** queries, but can be changed as you like. (Note: the specified domains are hidden only from you, it doesn't remove from the server.)

- Show the query's absolute time (HH:MM:SS) along with the relative time ("a minute ago", "few seconds ago").   
![Absolute time](https://i.imgur.com/KMtc55K.png)    

### Privacy page:

- Hide the list of blocklists enabled and adds a button to unhide them if needed. This is good for people with a long list of blocklists added.   
![Hidden lists](https://i.imgur.com/8b70mXH.png)    

- Sort alphabetically the list of blocklists in the "Add a blocklist" screen.

### Security page:

- Hide the list of added TLDs. It behaves the exact same way as the one in the Privacy page.

- A button that allows you to add every TLD in the "Add a TLD" screen with one click.   
![Add all TLDs button](https://i.imgur.com/PDlYlF1.png)     
Clicking on it will iterate trough all "Add" buttons and automatically click on each one of them. This may take several minutes. Depending on your connection's latency and your device's processing power, it can take less time. The fastest it can go, at perfectly ideal conditions, is 40 TLDs per second (around 40 seconds). At normal conditions it can take at least 2 minutes.

### Allowlist/Denylist pages:

- Ability to add a description to each domain in the deny/allow lists.   
![Description input](https://i.imgur.com/TqlKWxr.png)    
Just click on the "Add a description" message, input the description/label you want and press Enter to save it. Having done that, anytime you open the allowlist/Denylist pages, the description will appear beside the respective domain name.

- A button to sort the allow/deny lists alphabetically.   
![Sort A-Z](https://i.imgur.com/KKhgMdd.png)    

## Future features

- Add a Preferences screen to tweak some features to your like.

- Assign a domain to a group of domains in the allow/deny lists that can be collapsed/expanded and named.

- Only show queries that happened before a specified date/time.

- Ability to export in CSV format part of the logs.

- Real-time log.

- An option to temporarily allow a domain. The downside is that it would require the user to keep the NextDNS site open, or at least require to reopen it after the timer ends to auto remove the domain. I'm searching for some way to make it not require any of these.

- Add more items and more statistics in the Analytics page. The counting will be made locally (in the browser) based on the total queries count and the logs, which will allow many possibilities of statistical info.

## How to use it

To use this userscript, just install in your browser GreaseMonkey (Firefox), TamperMonkey (Chrome and Firefox) or ViolentMonkey (Chrome and Firefox) extension, if you hadn't yet. Having it installed, then just go to the following link: https://raw.githubusercontent.com/hjk789/NXEnhancer/master/NXEnhancer.user.js

A window will pop asking if you want to install the script, just confirm it, and it's done! 

If you use uMatrix, you have to allow frames to `my.nextdns.io` to use the allow/deny buttons feature.

On mobile, only Firefox Mobile has support for userscripts. The procedure is the same, install GreaseMonkey/TamperMonkey/ViolentMonkey and then install the userscript. However, keep in mind that NX Enhancer isn't optimized for mobile.

## Bug reports and suggestions

Although it's a work in progress, this userscript is completely usable at the current state, but there might be some situations where an unnoticed bug might get noticed. In these cases, please report it posting an issue on the [issues section](https://github.com/hjk789/NXEnhancer/issues). If you want to suggest more features, you can freely do it there too.

## Support

This project takes a lot of time and effort developing, analyzing, testing, fixing, researching and optimizing, most of these are because of the fact that it's being developed for public use, instead of just my personal use. If you appreciate this project, would like to give a thank you or support the continuation of the development, you can make a donation via PayPal. I'll gladly appreciate any help with any value:

[![Donate with PayPal](https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=CK5BFYUP9TWBJ&source=url)

## Disclaimers

I have no association with NextDNS Inc., I'm just a user of their service. NX Enhancer is a completely voluntary work. There are no warranties.

## License

- You can view the code, download a copy and run this software as is.
- You can suggest changes, either by opening issues or by doing pull requests. 
- You can link to this repository's homepage (https://github.com/hjk789/NXEnhancer). 
- You can modify your copy for personal use, although it's recommended that you suggest this modification to be included in the original, so all users can benefit.
- You can't do any other action not allowed in this license.  
It can happen that I forgot to add permission to some other action. If you are unsure whether you may or may not do something, please contact me.
