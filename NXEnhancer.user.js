// ==UserScript==
// @name			NX Enhancer
// @description		Adds quality-of-life features to NextDNS website for a more practical experience
// @author			BLBC (github.com/hjk789, reddit.com/u/dfhg89s7d89)
// @version			0.9
// @downloadURL		https://raw.githubusercontent.com/hjk789/NXEnhancer/master/NXEnhancer.user.js
// @updateURL		https://raw.githubusercontent.com/hjk789/NXEnhancer/master/NXEnhancer.user.js
// @grant			GM.setValue
// @grant			GM.getValue
// @match			https://my.nextdns.io/*
// ==/UserScript==

page = ""
domain = ""
hideDevices = false
GM.getValue("changed").then(function(value)
{
	if (value != true)
	{
		GM.setValue("domainsToHide", "nextdns.io\n.in-addr.arpa") // Hide theses queries by default, but only at the first time
		GM.setValue("changed", true)
	}
})

setInterval(function()
{
	if (page != location.href)
	{
		page = location.href


		// ---------------------- Logs page -------------------------


		if (/logs$/.test(location.href))
		{

			// Allow/Deny buttons on hover. Don't show the Allow button to already whitelisted domains, don't show the Deny button to already blacklisted/whitelisted domains, and show the Hide button to any domain

			let style = document.createElement("style")
			style.innerHTML = `.list-group-item:not([style*='rgb(46']):hover .btn-success { visibility: visible !important; }
							   .list-group-item:not([style*='rgb']):hover .btn-danger { visibility: visible !important; }
							   .list-group-item:hover .btn-secondary { visibility: visible !important; }`
			document.body.appendChild(style)

			let selector = "div > img + span:not(.processed)"

			waitForItems = setInterval(function()
			{
				if (/logs$/.test(location.href))
				{
					var queries = document.querySelectorAll(selector)

					if (queries.length > 0)
					{
						if (typeof iframeAllow == "undefined" && typeof iframeDeny == "undefined")
						{
							// Create iframes with the Allowlist/Denylist pages

							iframeAllow = document.createElement("iframe")
							iframeAllow.src = "./allowlist"
							iframeAllow.style = "position: absolute; right: 130px; height: 110px; width: 300px; visibility: hidden;"

							iframeDeny = document.createElement("iframe")
							iframeDeny.src = "./denylist"
							iframeDeny.style = iframeAllow.style.cssText

							let logsContainer = document.getElementsByClassName("list-group")[0].parentElement
							logsContainer.appendChild(iframeAllow)
							logsContainer.appendChild(iframeDeny)

							document.body.onclick = function()
							{
								iframeAllow.style.cssText += 'visibility: hidden;'
								iframeDeny.style.cssText += 'visibility: hidden;'
							}
						}


						// Create the "Other devices" button

						if (typeof otherDevices == "undefined")
						{
							var otherDevices = document.createElement("button")
							otherDevices.className = "dropdown-item"
							otherDevices.style = "border-top: 1px solid lightgray;"
							otherDevices.innerHTML = "Other devices"
						}

						var devicesDropdown = document.getElementsByClassName("Content")[0].getElementsByClassName("dropdown")[0]
						otherDevices.onmousedown = function()
						{
							devicesDropdown.lastChild.firstChild.click()
							devicesDropdown.firstChild.innerHTML = "Other devices"
							hideDevices = true
							return false // Don't let the site receive the click, because if you click on it a second time, the site throws an error saying that this device doesn't exist
						}

						// The original device picker dropdown replaces it's items everytime it's clicked,
						// so it's necessary to wait for this to happen first, then append the new button everytime

						waitDevicesDropdown = setInterval(function()	// Slight fix for the problem of not appearing the "Other Devices" button. This lowers the chances of not appearing
						{												// This bug happens because, for some yet unknown reason, this event isn't assigned to the dropdown
							devicesDropdown.firstChild.onmousedown = function()
							{
								if (typeof waitForDevicePicker == "undefined")
								{
									waitForDevicePicker = setInterval(function()
									{
										if (devicesDropdown.lastChild.className.includes("show"))
										{
											devicesDropdown.lastChild.appendChild(otherDevices)
											devicesDropdown.lastChild.firstChild.onclick = function() { devicesDropdown.firstChild.innerHTML = "All devices" }

											if (hideDevices)
											{
												devicesDropdown.lastChild.firstChild.className = "dropdown-item"
												devicesDropdown.lastChild.lastChild.className  = "dropdown-item active"
											}
											else devicesDropdown.lastChild.lastChild.className = "dropdown-item"

											setTimeout(function()
											{
												clearInterval(waitForDevicePicker)
												clearInterval(waitDevicesDropdown)
												waitForDevicePicker = undefined
											}, 250)
										}
									}, 100)
								}
							}
						}, 100)

						if (devicesDropdown.firstChild.innerHTML != "Other devices")
							hideDevices = false


						if (typeof filtersButton == "undefined" && typeof domainsToHideInput == "undefined")
						{
							// Create "Filters" button

							filtersButton = document.createElement("button")
							filtersButton.className = "btn btn-secondary"
							filtersButton.style = "position: absolute; right: 10px; bottom: 7px;"
							filtersButton.innerHTML = "Filters"
							filtersButton.onclick = function()
							{
								if (this.className.includes("secondary"))
								{
									domainsToHideInput.style.cssText += "visibility: visible;"
									this.innerHTML = "OK"
									this.className = this.className.replace("secondary", "primary")
								}
								else  // If it's clicked the second time
								{
									updateFilters()

									domainsToHideInput.style.cssText += "visibility: hidden;"
									this.innerHTML = "Filters"
									this.className = this.className.replace("primary", "secondary")
								}
							}

							// Create the filter's inputbox

							domainsToHideInput = document.createElement("textarea")
							domainsToHideInput.spellcheck = false
							domainsToHideInput.style = "position: absolute; left: 1140px; top: 15px; width: 320px; height: 240px; min-width: 250px; min-height: 100px; border-radius: 15px; border: 1px groove lightgray; \
														outline: 0px; padding-left: 10px; padding-right: 5px; padding-top: 5px; visibility: hidden; resize: both; overflow-wrap: normal;"

							GM.getValue("domainsToHide").then(function(value) { domainsToHideInput.value = value; domainsToHide = value.split("\n").filter(d => d.trim() != "") })

							let container = document.getElementsByClassName("Content")[0].getElementsByClassName("container")[0].firstChild
							container.style.cssText += "position: relative;"
							container.appendChild(filtersButton)
							container.appendChild(domainsToHideInput)
						}


						function updateFilters()
						{
							GM.setValue("domainsToHide", domainsToHideInput.value)
							domainsToHide = domainsToHideInput.value.split("\n").filter(d => d.trim() != "") // Don't include empty lines

							if (selector.includes(":not(.processed)"))
								selector = selector.replace(":not(.processed)", "") // Reinclude already processed queries so that it can filter in realtime
						}


						// Process the queries

						for (i=0; i < queries.length; i++)
						{
							var currentDomain = queries[i].textContent + queries[i].nextSibling.textContent

							if (!queries[i].parentElement.textContent.includes(".")	 // Chrome's random queries
								|| (hideDevices && queries[i].parentElement.parentElement.nextSibling.getElementsByClassName("device-name")[0]) // If enabled, named devices. Queries from unnamed devices don't have this element
								|| domainsToHide.some(d => currentDomain.includes(d)) ) // Domains included in the list of domains to hide
							{
								queries[i].parentElement.parentElement.parentElement.style = "display:none"
								queries[i].parentElement.parentElement.parentElement.className = ""
								queries[i].className = "processed"
								continue
							}


							// Create the Allow/Deny buttons

							if (!queries[i].className.includes("processed"))
							{
								let hide = document.createElement("button")
								hide.className = "btn btn-secondary"
								hide.innerHTML = "Hide"
								hide.style = "position:absolute; right: 400px; visibility: hidden;"
								hide.onclick = function()
								{
									domainsToHideInput.value += "\n" + this.previousSibling.children[1].textContent + this.previousSibling.children[2].textContent
									updateFilters()
								}

								let allow = document.createElement("button")
								allow.className = "btn btn-success"
								allow.innerHTML = "Allow"
								allow.style = "position: absolute; right: 200px; visibility: hidden;"
								setOnClickButton(allow, iframeAllow, iframeDeny, 330)

								let deny = document.createElement("button")
								deny.className = "btn btn-danger"
								deny.innerHTML = "Deny"
								deny.style = "position: absolute; right: 300px; visibility: hidden;"
								setOnClickButton(deny, iframeDeny, iframeAllow, 258)

								queries[i].parentElement.parentElement.parentElement.style.cssText += "position: relative;"
								queries[i].parentElement.parentElement.appendChild(hide)
								queries[i].parentElement.parentElement.appendChild(allow)
								queries[i].parentElement.parentElement.appendChild(deny)
								queries[i].className += " processed"
							}
						}

						if (!selector.includes(":not(.processed)"))
							selector += ":not(.processed)"	// After reprocessed, exclude already processed queries again


						// Prevent infinite scroll from being interrupted due to almost all queries being hidden

						if (window.innerWidth == document.body.clientWidth) // If there is no vertical scrollbar, then surely the body height is insufficient to trigger the infinite scroll
						{
							dummyTallEll = document.createElement("div") // Create a temporary element to fill the empty space
							dummyTallEll.className = "dummy"
							dummyTallEll.style.cssText = "height: " + (window.innerHeight - 300) + "px;"  // A static value was insufficient for big resolutions. This makes it relative to the window size
							document.querySelector(".Content .container ul").appendChild(dummyTallEll)
							scrollTo(0, window.innerHeight)
						}

						if (window.innerWidth != document.body.clientWidth)	 // If the scrollbar is now appearing, remove the dummy element
							document.getElementsByClassName("dummy")[0].remove()
					}
				}
				else
				{
					clearInterval(waitForItems)
					clearInterval(waitForDevicePicker)
					iframeAllow	  = undefined  // Force destroy when the page is changed
					iframeDeny	  = undefined
					otherDevices  = undefined
					filtersButton = undefined
					domainsToHideInput = undefined
				}

			}, 500)


			function setOnClickButton(button, frame, otherFrame, y)
			{
				button.onclick = function(event)
				{
					domain = frame.contentDocument.forms[0].children[0].value = this.parentElement.children[0].children[1].textContent + this.parentElement.children[0].children[2].textContent;
					frame.style.cssText += "top: " + (this.getBoundingClientRect().y - this.parentElement.parentElement.parentElement.getBoundingClientRect().y - 120) + "px;" // show the iframe just above the buttons
					frame.contentDocument.forms[0].previousElementSibling.innerHTML = "Press Space to confirm " + button.innerHTML.toLowerCase() + "..."
					frame.style.cssText += "visibility: visible;"
					otherFrame.style.cssText += "visibility: hidden;"
					frame.contentDocument.forms[0].children[0].focus()
					frame.contentWindow.scrollTo(0, y) // scroll in a way that it fits perfectly in the iframe
					event.stopPropagation() // don't raise this event to the body, as the body hides the iframes when clicked
				}
			}


			waitForInputboxAllow = setInterval(function() { setupInputBox(iframeAllow, waitForInputboxAllow ) }, 500);
			waitForInputboxDeny	 = setInterval(function() { setupInputBox(iframeDeny,  waitForInputboxDeny	) }, 500);


			function setupInputBox(frame, waitForInputbox)
			{
				if (frame.contentDocument != null && frame.contentDocument.forms[0] != null)
				{
					clearInterval(waitForInputbox)

					frame.contentDocument.body.style = "overflow: hidden;"
					let input = frame.contentDocument.forms[0].children[0]
					input.parentElement.parentElement.style.cssText += "padding-bottom: 30px;"
					input.parentElement.parentElement.parentElement.parentElement.style = "padding: 0px;"
					input.onkeyup = function(event)
					{
						let input = frame.contentDocument.forms[0].children[0]
						textSpan = input.parentElement.previousElementSibling // status message

						if (event.key == ' ' || event.key == "Enter")
						{
							textSpan.innerHTML = "Submitting..."
							if (event.key == ' ')
							{
								// Simulate Enter key press to submit, because form.submit() just redirects to ./allowlist#submit instead of submitting,
								// and the user having to press the spacebar is necessary to make the input box accept the enter press, as it refuses to submit if no character keys were pressed.
								// If the user edits the domain name, there's no need to press space, as the submitting was already enabled by the other pressed keys.

								const pressEnter = new KeyboardEvent('keypress', {keyCode: 13})
								this.dispatchEvent(pressEnter);
							}

							waitFinishSubmit = setInterval(function() { checkIfSubmitted(input, frame, waitFinishSubmit) }, 500)

						}
						else if (event.key.length == 1 || "Backspace|Delete".includes(event.key)) // whether it's a character key or backspace/delete keys
							textSpan.innerHTML = textSpan.innerHTML.replace("Space", "Enter")
						else if (event.key == "Escape")
							frame.style.cssText += 'visibility: hidden;'

					}

					let span = frame.contentDocument.createElement("span")
					span.style = "line-height: 3;"
					span.innerHTML = "Press Space to confirm allow..."
					input.parentElement.parentElement.insertBefore(span, input.parentElement)
				}
			}


			function checkIfSubmitted(inputbox, frame, waitSubmit)
			{
				if (inputbox.parentElement.parentElement.nextElementSibling.children[0].textContent.includes(domain))
				{
					inputbox.parentElement.previousElementSibling.innerHTML = "Done!"
					clearInterval(waitSubmit)
					setTimeout(function() { frame.style.cssText += "visibility: hidden;" }, 1000)
				}
				else if (inputbox.nextElementSibling.innerHTML != "") // if there's a submit error
				{
					textSpan.innerHTML = "Press Enter to submit..."
					clearInterval(waitSubmit)
				}
			}
		}


		// ---------------------- Privacy page -------------------------


		else if (/privacy$/.test(location.href))
		{
			waitForLists = setInterval(function()
			{
				if (document.querySelector(".list-group-item") != null)
				{
					clearInterval(waitForLists)

					// Hide list of blocklists
					hideAllListItems("Show added lists")


					// Sort blocklists alphabetically in the modal

					document.querySelector(".card-footer button").onclick = function()
					{
						waitForListsModal = setInterval(function()
						{
							if (document.getElementsByClassName("modal-body")[0].querySelector(".list-group-item") != null)
							{
								clearInterval(waitForListsModal)

								let tempLists = Array.from(document.querySelectorAll(".modal-body .list-group-item"))
								tempLists.sort(function(a, b) {
									if (a.textContent.toLowerCase() < b.textContent.toLowerCase()) return -1
									else if (a.textContent.toLowerCase() > b.textContent.toLowerCase()) return 1
									else if (a.textContent.toLowerCase() == b.textContent.toLowerCase()) return 0
								})

								let modal = document.getElementsByClassName("modal-body")[0].querySelector(".list-group")

								for (i=0; i < tempLists.length; i++)
									modal.appendChild(tempLists[i])

							}
						}, 500)
					}
				}
			}, 500)
		}


		// ---------------------- Security page -------------------------


		else if (/security$/.test(location.href))
		{
			waitForLists = setInterval(function()
			{
				if (document.querySelector(".list-group-item") != null)
				{
					clearInterval(waitForLists)

					// Hide list of TLDs
					hideAllListItems("Show added TLDs")


					// Create the "Add all TLDs" button in the modal

					document.querySelector(".card-footer button").onclick = function()
					{
						waitForListsModal = setInterval(function()
						{
							if (document.querySelector(".modal-body .list-group-item") != null)
							{
								clearInterval(waitForListsModal)

								let addAll = document.createElement("button")
								addAll.className = "btn btn-primary"
								addAll.style = "position: absolute; right: 100px; bottom: 10px;"
								addAll.innerHTML = "Add all TLDs"
								addAll.onclick = function()
								{
									if(confirm("This may take several minutes (1 minute in ideal conditions). Are you sure?"))
									{
										let buttons = document.querySelectorAll(".modal-body .btn-primary");
										i=0
										addAllInterval = setInterval(function()	 // Here an interval is being used instead of a for, because a for was causing the browser to freeze
										{
											buttons[i].scrollIntoView() // To see the progress. Without this, it gets slightly faster
											buttons[i].click()

											i++
											if (i == buttons.length)
												clearInterval(addAllInterval)

										}, 25) // 25ms delay to prevent the browser from hanging
									}
								}

								let header = document.querySelector(".modal-header")
								header.style = "position: relative;"
								header.appendChild(addAll)
							}
						}, 500)
					}
				}
			}, 500)

		}



		function hideAllListItems(text)
		{
			let items = document.querySelector(".list-group").children

			// Hide items

			for (i=1; i < items.length; i++)
				items[i].style.cssText += "display: none;"

			// Create "Show" button

			let show = document.createElement("button")
			show.className = "btn btn-primary"
			show.style = "position:absolute;right: 200px;top: 30px;"
			show.innerHTML = text
			show.onclick = function() {
				for (i=1; i < items.length; i++)
					items[i].style.cssText += "display: block;"
			}

			items[0].style += "position: relative;"
			items[0].appendChild(show)
		}

	}
}, 1000)