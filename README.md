# NX Enhancer
A userscript that adds "quality-of-life" features to NextDNS website to make the experience of managing lists, domains, etc. more practical.

**Current features:**
-
Logs page:
-

- An Allow/Deny button in the logs that make it possible to add an exception or block a domain without needing to copy, switch pages, and paste.  ![Allow and Deny butttons](https://i.imgur.com/eRxvkP3.png)
When clicked, it pops a small view of the Allowlist/Denylist pages and auto fills the input field with the domain respective to the button clicked, allowing you to edit the domain name if you want, and when finished, just confirm.

- Hide `*.nextdns.io` queries and also those Chrome based browsers' randomly generated domains queries (like `vkpwqcakgflqeq`, `lfujniwzrouh`, etc.)

- Option to show only queries from unnamed devices.   
![Other Devices button](https://i.imgur.com/jwdiBgB.png)

- Added the ability to specify domains that should be hidden from the logs. It comes with a "Filters" button that, when clicked, show the list of domains currently set to be hidden.  
![New domain filtering for the logs](https://i.imgur.com/AnhJRde.png)   
You can either manually type (or paste) domains, or click on the new "Hide" button, alongside the Allow/Deny buttons, which lets you hide domains with one click. If you wish want to edit the domain, just click on the "Filters" button and edit the domain. By default, it hides **\*.nextdns.io** and **.arpa** queries, but can be changed as you like. 

Privacy page:
- 

- Hide the list of blocklists enabled and adds a button to unhide them if needed. This is good for people with a long list of blocklists added. ![Hidden lists](https://i.imgur.com/Sx2KIs2.png)

- Sort alphabetically the list of blocklists in the "Add a blocklist" screen.

**Upcoming features:**
-

- Option to specify a list of domains to be hidden from the logs.

- A button in the "Add TLD" screen to add all TLDs at once.

- Show the query's absolute date-time when hovering over the relative time ("a minute ago", "few seconds ago").

- Ability to add a description to each domain in the deny/allow lists.

**Future features:**
-

- Add a Preferences screen to tweak some features to your like and save it permanently (which persists saved even after page refreshes and browser restarts).

- Real-time log.

- Add more items and more statistics in the Analytics page. The counting will be made locally (in the browser) based on the total queries count and the logs, which will allow many possibilities of statistical info.

**How to use it:**
-

To use this userscript, just install in your browser GreaseMonkey (Firefox), TamperMonkey (Chrome) or ViolentMonkey (Chrome and Firefox) extension, if you hadn't yet. Having it installed, then just go to the following link: https://raw.githubusercontent.com/hjk789/NXEnhancer/master/NXEnhancer.user.js

A window will pop asking if you want to install the script, just confirm it, and it's done! 

If you don't want to install an extension, you can freely run the code like any other JavaScript code, the only downside is that you would have to run it manually every time you want to use it.

If you use uMatrix, you have to allow frames to `my.nextdns.io` to use the allow/deny buttons feature.

On mobile, only Firefox Mobile has support for userscripts. The procedure is the same, install GreaseMonkey/ViolentMonkey and then install the userscript.

**Bug reports and suggestions:**
-

Although it's a work in progress, this userscript is completely usable at the current state, but there might be some situations where an unnoticed bug might be noticed. In these cases, please report it posting an issue on the [issues section](https://github.com/hjk789/NXEnhancer/issues). If you want to suggest more features, you can freely do it there too.
