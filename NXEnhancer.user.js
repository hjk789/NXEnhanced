// ==UserScript==
// @name			NX Enhancer
// @description		Adds quality-of-life features to NextDNS website for a more practical experience
// @author			BLBC (github.com/hjk789, reddit.com/u/dfhg89s7d89)
// @version			1.5
// @downloadURL		https://raw.githubusercontent.com/hjk789/NXEnhancer/master/NXEnhancer.user.js
// @updateURL		https://raw.githubusercontent.com/hjk789/NXEnhancer/master/NXEnhancer.user.js
// @grant			GM.setValue
// @grant			GM.getValue
// @noframes
// @match			https://my.nextdns.io/*
// ==/UserScript==

let page = ""
let hideDevices = false
let intervals = []

const isChrome = window.chrome != null

GM.getValue("changed").then(function(value)
{
	if (value != true)
	{
		GM.setValue("domainsToHide", "nextdns.io\n.in-addr.arpa") // Hide theses queries by default, but only at the first time
		GM.setValue("changed", true)
	}
})

GM.getValue("domainDescriptions").then(function(value)
{
	if (value == undefined)
	{
		descriptions = new Object()
		GM.setValue("domainDescriptions", JSON.stringify(descriptions))
	}
	else descriptions = JSON.parse(value)

})



// Allow/Deny buttons on hover. Don't show the Allow button to already whitelisted domains,
// don't show the Deny button to already blacklisted/whitelisted domains, and show the Hide button to any domain

const style = document.createElement("style")
style.innerHTML = `.list-group-item:not([style*='rgb(46']):hover .btn-success { visibility: visible !important; }
                   .list-group-item:not([style*='rgb']):hover .btn-danger { visibility: visible !important; }
                   .list-group-item:hover .btn-secondary { visibility: visible !important; }
                   .list-group-item div div:hover input.description, input.description:focus { visibility: visible !important; }`

document.head.appendChild(style)

setInterval(function()
{
	if (page != location.href)
	{
		page = location.href
		destroyIntervalsAndObjects()


		// ---------------------- Logs page -------------------------


		if (/logs$/.test(location.href))
		{
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
							iframeAllow.style = "position: absolute; right: 130px; height: 110px; width: 320px; visibility: hidden; border: 2px solid lightgray; border-radius: 15px;"

							iframeDeny = document.createElement("iframe")
							iframeDeny.src = "./denylist"
							iframeDeny.style = iframeAllow.style.cssText

							const logsContainer = document.getElementsByClassName("list-group")[0].parentElement
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

						const devicesDropdown = document.getElementsByClassName("Content")[0].getElementsByClassName("dropdown")[0]
						otherDevices.onmousedown = function()
						{
							devicesDropdown.lastChild.firstChild.click()
							devicesDropdown.firstChild.innerHTML = "Other devices"
							hideDevices = true
							return false // Don't let the site receive the click, because if you click on it a second time, the site throws an error saying that this device doesn't exist
						}

						// The original device picker dropdown replaces it's items every time it's clicked,
						// so it's necessary to wait for this to happen first, then append the new button every time

						devicesDropdown.firstChild.onclick = function()
						{
							if (typeof waitForDevicePicker == "number")
								clearInterval(waitForDevicePicker)

							waitForDevicePicker = setInterval(function()
							{
								const devicesContainer = devicesDropdown.lastChild
								if (devicesContainer.className.includes("show"))
								{
									devicesContainer.appendChild(otherDevices)
									devicesContainer.firstChild.onclick = function() { devicesDropdown.firstChild.innerHTML = "All devices" }

									if (hideDevices)
									{
										devicesContainer.firstChild.className = "dropdown-item"			// All devices
										devicesContainer.lastChild.className  = "dropdown-item active"  // Other devices
									}
									else devicesContainer.lastChild.className = "dropdown-item"

									clearInterval(waitForDevicePicker)
								}
							}, 50)

							intervals.push(waitForDevicePicker)
						}

						if (devicesDropdown.firstChild.innerHTML != "Other devices")
							hideDevices = false


						if (typeof filtersButton == "undefined" && typeof domainsToHideInput == "undefined")
						{
							// Create "Filters" button

							filtersButton = document.createElement("button")
							filtersButton.className = "btn btn-secondary"
							filtersButton.style = "position: absolute; right: 15px; bottom: 7px;"
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

							GM.getValue("domainsToHide").then(function(value) {
								domainsToHideInput.value = value
								domainsToHide = value.split("\n").filter(d => d.trim() != "")
							})

							const container = document.getElementsByClassName("Content")[0].getElementsByClassName("container")[0].firstChild
							container.style.cssText += "position: relative;"
							container.appendChild(filtersButton)
							container.appendChild(domainsToHideInput)
						}


						function updateFilters()
						{
							GM.setValue("domainsToHide", domainsToHideInput.value)
							domainsToHide = domainsToHideInput.value.split("\n").filter(d => d.trim() != "") // Don't include empty lines

							if (selector.includes(":not(.processed)"))
								selector = selector.replace(":not(.processed)", "") // Reinclude already processed queries so that it can refilter in realtime
						}


						// Process the queries

						let visibleQueries = 0

						for (let i = 0; i < queries.length; i++)
						{
							const currentDomain = queries[i].textContent + queries[i].nextSibling.textContent
							const listItemSpace = queries[i].parentElement.parentElement
							const listItem = listItemSpace.parentElement

							if (!queries[i].parentElement.textContent.includes(".")  // Chrome's random queries
								|| (hideDevices && listItemSpace.nextSibling.getElementsByClassName("device-name")[0]) // If enabled, named devices. Queries from unnamed devices don't have this element
								|| domainsToHide.some(d => currentDomain.includes(d)) ) // Domains included in the list of domains to hide
							{
								listItem.style = "display:none"
								listItem.className = ""
								queries[i].className = "processed"
								continue
							}

							visibleQueries++


							// Create the Hide/Allow/Deny buttons

							if (!queries[i].className.includes("processed"))  // Prevent the buttons from being added again when reprocessed
							{
								const hide = document.createElement("button")
								hide.className = "btn btn-secondary"
								hide.innerHTML = "Hide"
								hide.style = "position:absolute; right: 400px; visibility: hidden;"
								hide.onclick = function()
								{
									domainsToHideInput.value += "\n" + this.previousSibling.children[1].textContent + this.previousSibling.children[2].textContent
									updateFilters()
								}

								const deny = document.createElement("button")
								deny.className = "btn btn-danger"
								deny.innerHTML = "Deny"
								deny.style = "position: absolute; right: 300px; visibility: hidden;"
								setOnClickButton(deny, iframeDeny, iframeAllow)

								const allow = document.createElement("button")
								allow.className = "btn btn-success"
								allow.innerHTML = "Allow"
								allow.style = "position: absolute; right: 200px; visibility: hidden;"
								setOnClickButton(allow, iframeAllow, iframeDeny)

								listItem.style.cssText += "position: relative;"
								listItem.className += " visible"
								listItemSpace.appendChild(hide)
								listItemSpace.appendChild(deny)
								listItemSpace.appendChild(allow)
								queries[i].className += " processed"
							}
						}

						if (!selector.includes(":not(.processed)"))
							selector += ":not(.processed)"	// After reprocessed, exclude already processed queries again


						// Prevent infinite scroll from being interrupted due to almost all queries being hidden

						if (window.innerWidth == document.body.clientWidth) // If there is no vertical scrollbar, then surely the body height is insufficient to trigger the infinite scroll
						{
							const dummyTallEll = document.createElement("div") // Create a temporary element to fill the empty space
							dummyTallEll.style.cssText = "height: " + (window.innerHeight - 300) + "px;"  // A static value is insufficient for big resolutions. This makes it relative to the window size
							document.querySelector(".Content .container ul").appendChild(dummyTallEll)
							scrollTo(0, document.body.clientHeight)
							dummyTallEll.remove()
						}
						else if (visibleQueries < 7 && document.body.getBoundingClientRect().bottom < window.innerHeight + 200)
						{
							// If all or almost all of the chunk's queries are hidden, automatically scroll up and down to trigger the loading of the next chunk
							scrollTo(0, document.body.clientHeight - window.innerHeight)
							scrollTo(0, document.body.clientHeight)
						}


						// Add the absolute time beside the relative time

						if (typeof checkQueriesTime == "undefined")
						{
							function addAbsoluteTime()
							{
								const relativeQueries = document.getElementsByClassName("visible")

								for (i=0; i < relativeQueries.length; i++)
								{
									const time = relativeQueries[i].querySelector("time")

									if (/ago|in/.test(time.textContent) && !time.textContent.includes(":"))
										time.innerHTML = time.innerText + "&nbsp; (" + new Date(+time.attributes["datetime"].value).toLocaleTimeString() + ")"
									else
										break  // Stop when there's no more queries with relative time
								}
							}

							addAbsoluteTime()

							checkQueriesTime = setInterval( function() { addAbsoluteTime() }, 5000)  // NextDNS site overwrites the time element every minute, so this needs to be repeated

							intervals.push(checkQueriesTime)
						}

					}
				}

			}, 500)

			intervals.push(waitForItems)


			function setOnClickButton(button, frame, otherFrame)
			{
				button.onclick = function(event)
				{
					const form = frame.contentDocument.forms[0]
					const input = form.firstChild
					const domainContainer = this.parentElement.firstChild
					const logContainer = this.parentElement.parentElement.parentElement
					const allowDenyList = form.parentElement.nextSibling

					input.value = domainContainer.children[1].textContent + domainContainer.children[2].textContent;  // Subdomains + root domain

					let domain = input.value

					while (domain.indexOf(".") >= 0)
					{
						domain = domain.substring(domain.indexOf(".") + 1)
						if (allowDenyList.textContent.includes("*." + domain))
						{
							input.nextSibling.innerHTML = "This subdomain is already included!"
							input.className += " is-invalid"
							input.oninput = function() { this.className = this.className.replace(" is-invalid", ""); this.nextSibling.innerHTML = "" }
							break
						}
					}

					frame.style.cssText += "top: " + (this.getBoundingClientRect().y - logContainer.getBoundingClientRect().y - 120) + "px;" // Show the iframe just above the buttons
					form.previousElementSibling.innerHTML = (!isChrome ? "Press Space to confirm " : "Press Space then Enter to confirm ") + button.textContent.toLowerCase() + "..."
					frame.style.cssText += "visibility: visible;"
					otherFrame.style.cssText += "visibility: hidden;"
					input.focus()
					event.stopPropagation() // Don't raise this event to the body, as the body hides the iframes when clicked
				}
			}


			waitForInputboxAllow = setInterval(function() { setupInputBox(iframeAllow, waitForInputboxAllow ) }, 500);
			waitForInputboxDeny  = setInterval(function() { setupInputBox(iframeDeny,  waitForInputboxDeny	) }, 500);

			intervals.push(waitForInputboxAllow)
			intervals.push(waitForInputboxDeny)

			function setupInputBox(frame, waitForInputbox)
			{
				if (frame.contentDocument != null && frame.contentDocument.forms[0] != null)
				{
					clearInterval(waitForInputbox)

					const input = frame.contentDocument.forms[0].firstChild
					const formContainer = input.parentElement.parentElement

					frame.contentDocument.body.style = "overflow: hidden;"
					formContainer.style.cssText += "padding-bottom: 30px;"
					formContainer.parentElement.parentElement.style = "padding: 0px;"
					input.onkeyup = function(event)
					{
						const input = frame.contentDocument.forms[0].firstChild
						textSpan = input.parentElement.previousElementSibling // status message

						if ((!isChrome && event.key == ' ') || (event.key == "Enter" && textSpan.textContent.includes("Press Enter")))
						{
							textSpan.innerHTML = "Submitting..."

							if (event.key == ' ')
							{
								// Simulate Enter key press to submit, because form.submit() just redirects to ./allowlist#submit instead of submitting,
								// and the user having to press the spacebar is necessary to make the input box accept the enter press, as it refuses to submit if no character keys were pressed.
								// If the user edits the domain name, there's no need to press space, as the submitting was already enabled by the other pressed keys.

								const pressEnter = new KeyboardEvent('keypress', {keyCode: 13})
								this.dispatchEvent(pressEnter); // Only works in Firefox, there's no way to make a simulated key press to work in Chrome without extension authority
							}

							waitFinishSubmit = setInterval(function() { checkIfSubmitted(input, frame, waitFinishSubmit) }, 250)

							intervals.push(waitFinishSubmit)

						}
						else if (event.key.length == 1 || "Backspace|Delete".includes(event.key)) // Whether it's a character key or backspace/delete keys
							textSpan.innerHTML = textSpan.innerHTML.replace(/Press Space( then Enter)?/, "Press Enter")
						else if (event.key == "Escape")
							frame.style.cssText += 'visibility: hidden;'

					}

					const span = frame.contentDocument.createElement("span")
					span.style = "line-height: 2.5;"
					span.innerText = "Press Space to submit..."

					formContainer.insertBefore(span, input.parentElement)

					// Scroll just one time and relative to the current y position of the inputbox, this prevents a displaced view if there's additional elements above in the page
					frame.contentWindow.scrollTo(0, input.getBoundingClientRect().y - frame.contentDocument.body.getBoundingClientRect().y - 38)
				}
			}


			function checkIfSubmitted(inputbox, frame, waitSubmit)
			{
				let lastAddedDomain = inputbox.parentElement.parentElement.nextElementSibling.firstChild.textContent

				if (lastAddedDomain.includes(inputbox.value))
				{
					inputbox.parentElement.previousElementSibling.innerHTML = "Done!"
					setTimeout(function() { frame.style.cssText += "visibility: hidden;" }, 1000)
					clearInterval(waitSubmit)
				}
				else if (inputbox.nextElementSibling.innerHTML != "") // If there's a submit error
				{
					textSpan.innerHTML = "Press Enter to submit..."
					clearInterval(waitSubmit)
				}
			}



		// ---------------------- Privacy page -------------------------


		}
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
							if (document.querySelector(".modal-body .list-group-item") != null)
							{
								clearInterval(waitForListsModal)

								sortItemsAZ(".modal-body .list-group")

							}
						}, 100)

						intervals.push(waitForListsModal)
					}
				}
			}, 500)

			intervals.push(waitForLists)



		// ---------------------- Security page -------------------------


		}
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

								const addAll = document.createElement("button")
								addAll.className = "btn btn-primary"
								addAll.style = "position: absolute; right: 100px; bottom: 10px;"
								addAll.innerHTML = "Add all TLDs"
								addAll.onclick = function()
								{
									if(confirm("This may take several minutes (1 minute in ideal conditions). Are you sure?"))
									{
										const buttons = document.querySelectorAll(".modal-body .btn-primary")

										i=0
										addAllInterval = setInterval(function()   // Here an interval is being used instead of a for, because a for makes the browser freeze while doing this
										{
											buttons[i].scrollIntoView() // To see the progress. Without this, it gets slightly faster
											buttons[i].click()

											i++
											if (i == buttons.length)
												clearInterval(addAllInterval)

										}, 25) // 25ms delay to prevent the browser from hanging

										intervals.push(addAllInterval)
									}
								}

								const header = document.querySelector(".modal-header")
								header.style = "position: relative;"
								header.appendChild(addAll)
							}
						}, 500)
					}
				}
			}, 500)

			intervals.push(waitForLists)



		// ---------------------- Allowlist/Denylist page -------------------------


		}
		else if (/allowlist$|denylist$/.test(location.href))
		{
			waitForLists = setInterval(function()
			{
				if (document.querySelector(".list-group-item") != null)
				{
					clearInterval(waitForLists)


					// Create the "Sort by TLD" checkbox

					const sortOptionsContainer = document.createElement("div")
					sortOptionsContainer.style = "position: absolute; right: -130px; bottom: 10px;"

					const rectangleAboveInput = document.querySelector(".list-group")
					rectangleAboveInput.style = "position: relative;"

					const sortTLDSwitch = createSwitchCheckbox("Sort by TLD")

					sortOptionsContainer.appendChild(sortTLDSwitch)
					rectangleAboveInput.appendChild(sortOptionsContainer)


					// Create the "Sort A-Z" button

					const sortAZButton = document.createElement("button")
					sortAZButton.className = "btn btn-primary"
					sortAZButton.style = "position: absolute; right: 20px; bottom: 6px"
					sortAZButton.innerHTML = "Sort A-Z"
					sortAZButton.onclick = function() { sortItemsAZ(".list-group:nth-child(2)", "domain", sortTLDSwitch.firstChild); this.blur() }

					rectangleAboveInput.appendChild(sortAZButton)


					// Create the input box for the domain descriptions

					const domainsItems = document.querySelectorAll(".list-group-item")

					for (i=1; i < domainsItems.length; i++)
					{
						const descriptionInput = document.createElement("input")
						descriptionInput.className = "description"
						descriptionInput.placeholder = "Add a description. Press Enter to submit"
						descriptionInput.style = "width: 450px; margin-left: 40px; border: 0; background: transparent; color: gray;"
						descriptionInput.onkeypress = function(event)
						{
							if (event.key == "Enter")
							{
								descriptions[this.previousSibling.textContent.substring(2)] = this.value
								GM.setValue("domainDescriptions", JSON.stringify(descriptions))
								if (this.value != "")
									this.style.cssText += "visibility: visible;"
								else
									this.style.cssText += "visibility: hidden;"

								this.blur()
							}
						}

						descriptionInput.value = descriptions[domainsItems[i].textContent.substring(2)] || ""

						if (descriptionInput.value == "")
							descriptionInput.style.cssText += "visibility: hidden;"

						domainsItems[i].firstChild.firstChild.appendChild(descriptionInput)
					}

				}

			}, 500)

			intervals.push(waitForLists)

		}


		function createSwitchCheckbox(inner)
		{
			const container = document.createElement("div")
			container.className = "custom-switch"

			const checkbox = document.createElement("input")
			checkbox.type = "checkbox"
			checkbox.id = "id" + Date.now()   // There's no need to specify a human-readable id, but it needs to be unique
			checkbox.className = "custom-control-input"

			const label = document.createElement("label")
			label.innerHTML = inner
			label.style = "margin-left: 10px; user-select: none;"
			label.htmlFor = checkbox.id
			label.className = "custom-control-label"

			container.appendChild(checkbox)
			container.appendChild(label)

			return container
		}


		function sortItemsAZ(selector, type = "", element = null)
		{
			const container = document.querySelector(selector)
			const items = Array.from(container.children)

			if (type == "domain")
			{
				const SLDs = ["co","com","org","edu","gov","mil","net"]

				let startingLevel = 1  // From last to first

				if (!element.checked)
					startingLevel++

				items.sort(function(a, b)
				{
					const tempA = a.textContent.toLowerCase().substring(2).split(".")
					const tempB = b.textContent.toLowerCase().substring(2).split(".")

					let levelA = tempA.length - startingLevel
					let levelB = tempB.length - startingLevel

					a = tempA[levelA]
					b = tempB[levelB]

					if (startingLevel == 2)
					{
						if (SLDs.includes(tempA[levelA]))  // If the domain before the TLD is a SLD, instead of a root domain ...
							a = tempA[--levelA]  		   // ... skip it.

						if (SLDs.includes(tempB[levelB]))
							b = tempB[--levelB]
					}

					while(true)  // Repeat until reaching a return
					{
						if 		(a <  b) return -1
						else if (a >  b) return 1
						else if (a == b)  // If both items share the same domain ...
						{
							levelA-- 	  // ... then skip to a deeper level ...
							levelB--

							if (typeof tempA[levelA] != "undefined" && typeof tempB[levelB] != "undefined")  // ... but only if both have a deeper level.
							{
								a = tempA[levelA]
								b = tempB[levelB]
							}
							else if (typeof tempA[levelA] == "undefined" && typeof tempB[levelB] != "undefined")  // This happens when an upper level domain is compared with a deeper level one.
								return -1																		  // In this case, bring the upper level one to the top
							else if (typeof tempA[levelA] != "undefined" && typeof tempB[levelB] == "undefined")
								return 1
							else return 0
						}
					}
				})
			}
			else
			{
				items.sort(function(a, b)
				{
					a = a.textContent.toLowerCase()
					b = b.textContent.toLowerCase()

					if 		(a <  b) return -1
					else if (a >  b) return 1
					else if (a == b) return 0
				})
			}

			for (let i = 0; i < items.length; i++)
				container.appendChild(items[i])
		}


		function destroyIntervalsAndObjects()
		{
			for (i=0; i < intervals.length; i++)
				clearInterval(intervals[i])

			iframeAllow   = undefined  // Force destroy when the page is changed
			iframeDeny	  = undefined
			otherDevices  = undefined
			filtersButton = undefined
			domainsToHideInput = undefined
		}


		function hideAllListItems(text)
		{
			const items = document.querySelector(".list-group").children

			// Hide items

			for (let i = 1; i < items.length; i++)
				items[i].style.cssText += "display: none;"

			// Create "Show" button

			const show = document.createElement("button")
			show.className = "btn btn-primary"
			show.style = "position:absolute;right: 200px;top: 30px;"
			show.innerHTML = text
			show.onclick = function() {
				for (let i = 1; i < items.length; i++)
					items[i].style.cssText += "display: block;"
			}

			items[0].style += "position: relative;"
			items[0].appendChild(show)
		}

	}


}, 500)
