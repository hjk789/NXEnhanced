<p align="center"><img src="https://i.imgur.com/NIORJ58.png"></p>
<h1 align="center">NX Enhanced</h1>
<p>Adds "quality-of-life" features to NextDNS website to make the experience of managing lists, domains, etc. more practical. </p>

<p align="center">
<span align="center"><a href="https://addons.mozilla.org/addon/nx-enhanced?utm_source=github&utm_content=firefoximg"><img src="https://i.imgur.com/QFwk4Yk.png"></a></span><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span><span align="center"><a href="https://greasyfork.org/scripts/408934-nx-enhanced" align="center"><img src="https://i.imgur.com/ovI0w6c.png"></a></span>
</p>



## Current features

### Logs page:

- Allow/Deny buttons in the logs that make it possible to add an exception or block a domain without needing to copy, switch pages, and paste.
  ![Allow and Deny butttons](https://i.imgur.com/3XNMUi1.png)

  You can either add the respective domain or the whole root domain, or even edit the domain if you want.
  [Read more](https://github.com/hjk789/NXEnhanced/wiki#an-allowdeny-button-for-each-log-entry)

- Ability to specify domains that should be hidden from the logs

  ![Domain filtering](https://i.imgur.com/l8Ouzh1.png)

  You can either manually input domains, or click on the "Hide" button, alongside the Allow/Deny buttons, which lets you hide domains with few clicks.  [Read more](https://github.com/hjk789/NXEnhanced/wiki#ability-to-specify-domains-that-should-be-hidden-from-the-logs)

- Ability to load only the logs that happened before a specified date-time

  ![only logs before](https://i.imgur.com/FChYIoS.png)

- Option to show only queries from unnamed devices

  ![Other Devices button](https://i.imgur.com/V7HFiJL.png)

- An option to show the number of entries currently loaded, visible or hidden by filters

  ![counters](https://i.imgur.com/8mTEDt1.png)

- Show the query's absolute time (HH:MM:SS) along with the relative time ("a minute ago", "few seconds ago")

  ![Absolute time](https://i.imgur.com/I3pGNL8.png)

- A refresh button

  ![refresh button](https://i.imgur.com/yBEo3mV.png)

### Allowlist/Denylist pages:

- Ability to add a description to each domain in the allow/denylists. [Read more](https://github.com/hjk789/NXEnhanced/wiki#ability-to-add-a-description-to-each-domain-in-the-denyallow-lists)
  ![Description input](https://i.imgur.com/TqlKWxr.png)

- Sort the allow/deny lists alphabetically, and styling options to the domains for an easier quick reading, such as: lighten subdomains, bold root domain and right-align.

  ![allow/deny options](https://i.imgur.com/DiuO5TB.png)

- Ability to add multiple domains to allow/deny lists


### Settings page:

- Ability to export/import all settings from/to a config. [Read more](https://github.com/hjk789/NXEnhanced/wiki#ability-to-exportimport-all-settings-fromto-a-config)

  ![Export/import buttons](https://i.imgur.com/2oEl8t2.png)

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


## How to use it

For Firefox, just click the "Get the Addon" link above, then click the "Add to Firefox" button and confirm.

For Chrome (and other Chromium based browsers), it's not available in the Chrome Web Store, so you have to install it manually. To do so, download [the ZIP](https://github.com/hjk789/NXEnhanced/archive/master.zip), extract it, move the extracted folder to somewhere safe, in Chrome go to `chrome://extensions` (the page with the list of your installed extensions), enable the Developer Mode, click "Load Unpacked", open the extracted folder and choose the "WebExtension" folder. Done! Just remember to never disable the developer mode, or else the extension gets uninstalled and you lose all your settings.
To update the extension the process is almost the same, the only difference is that, after you extract the zip, you have to merge the new WebExtension folder to the old one, replacing the old files, then in `chrome://extensions` click the refresh button (the one beside the switch).

NX Enhanced was tested in Firefox and Chrome. It should work fine in pretty much any browser that accepts Firefox or Chrome extensions, although I didn't tested them.

You also have the option of using the userscript version, but it works only in Chrome, in Firefox it works partially. Also, keep in mind that the userscript is discontinued. For more information and instructions, read [here](https://github.com/hjk789/NXEnhanced/tree/master/Userscript#how-to-use-it).

## Bug reports, suggestions and questions

In case you experience any problem with NX Enhanced, or you want to make suggestions, you are encouraged to post a new issue on the [Issues section](https://github.com/hjk789/NXEnhanced/issues). Any feedback is welcome, appreciated and encouraged. If you have any questions you can start a new discussion in the [Discussions section](https://github.com/hjk789/NXEnhanced/discussions).

## How to contribute

If you would like to contribute with code, you just need to:
1. [Make a fork](https://github.com/hjk789/NXEnhanced/fork) of this project's repository by clicking on the "Fork" button on the top-right corner of the repository page;
2. Make your proposed changes in the code of the fork you created. When done, push the changes;
3. Go to the [Pull requests page](https://github.com/hjk789/NXEnhanced/pulls) and click the "New pull request" button. And finally, click the "Create pull request" button.

If you can't code, but still want to contribute, you can do so by making a donation. This project takes a lot of time and effort developing, analyzing, testing, fixing, researching and optimizing, most of these are because it's being developed for public use, instead of just my personal use. If you appreciate this project, would like to give a thank you or support the continuation of the development, consider making a donation:

[![Donate](https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=CK5BFYUP9TWBJ&source=url)

## License

- You can view the code, download copies to your devices, install, run, use the features added to the page and uninstall this software.
- You can suggest changes, either by opening issues or by doing pull requests.
- You can create or participate in discussions, give feedback and rate this project.
- You can link to this project's repository homepage (https://github.com/hjk789/NXEnhanced).
- You can modify your downloaded copy as you like, although it's recommended that you suggest this modification to be included in the original, so all users can benefit.
- You can make a fork of this project, provided that: 1. You fork it inside GitHub, by clicking on the "Fork" button of this project's repository web page; and 2. You fork it in order to push changes to this project's repository with a pull request. If you don't fit in these conditions, don't fork it, "*Star*" it instead.
- You cannot do any other action not allowed in this license.

I have no association with NextDNS Inc., I'm just a user of their DNS service who needed the features NX Enhanced provides. NX Enhanced is a completely voluntary work. I am not responsible for any damage or leak, directly or indirectly related to the use or misuse of this software. The responsibility is completely on it's users. Use it at your own risk. There are no warranties, either implied or stated.

Copyright (c) 2020+ BLBC ([hjk789](https://github.com/hjk789))

## Privacy policy

You can read the full privacy policy [here](https://github.com/hjk789/NXEnhanced/wiki/Privacy-Policy). In brief, most of what you need to know is in the first line: "NX Enhanced does not collect and does not send your data to third-parties, it also does not include any kind of tracking or analytics in the code."
