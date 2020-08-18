// ==UserScript==
// @name			NX Enhancer
// @description		Adds quality-of-life features to NextDNS website for a more practical experience
// @author			BLBC (github.com/hjk789, greasyfork.org/users/679182-hjk789, reddit.com/u/dfhg89s7d89)
// @copyright		2020+, BLBC (github.com/hjk789, greasyfork.org/users/679182-hjk789, reddit.com/u/dfhg89s7d89)
// @version			2.2
// @homepage        https://github.com/hjk789/NXEnhancer
// @license         https://github.com/hjk789/NXEnhancer#license
// @supportURL      https://github.com/hjk789/NXEnhancer/issues
// @downloadURL		https://greasyfork.org/scripts/408934-nx-enhancer/code/NX%20Enhancer.user.js
// @updateURL		https://greasyfork.org/scripts/408934-nx-enhancer/code/NX%20Enhancer.user.js
// @grant			GM.setValue
// @grant			GM.getValue
// @match			https://my.nextdns.io/*
// @match			https://api.nextdns.io/*
// ==/UserScript==


if (window.top == window.self)
{
	let page = ""
	let hideDevices = false
	let filtering = true
	let intervals = []
	
	const isChrome = window.chrome != null
	var descriptions, allowDenyOptions
	
	
	getGMsettings()
	
	
	// Allow/Deny buttons on hover. Don't show the Allow button to already whitelisted domains,
	// don't show the Deny button to already blacklisted/whitelisted domains, and show the Hide button to any domain
	
	const style = document.createElement("style")
	style.innerHTML = `.list-group-item:not([style*='rgb(46']):hover .btn-success { visibility: visible !important; }
					   .list-group-item:not([style*='rgb']):hover .btn-danger { visibility: visible !important; }
					   .list-group-item:hover .btn-secondary { visibility: visible !important; }
					   .list-group-item div div:hover input.description, input.description:focus { visibility: visible !important; }`	 // Show the allow/denylist domains description input box on hover, and when the input is focused

	document.head.appendChild(style)


	window.addEventListener("message", function(e) {
		eval(e.data.callback)  		// Run the callback when the HTTP request is completed. Here, PostMessage is only necessary for asynchronous requests,
	}, false)						// as it would be pretty hacky to do this in any other way, and asynchronous requests here are only necessary for slow connections.
	

	const ApiFrame = document.createElement("object")  // Here an OBJECT element is being used instead of an IFRAME because of a bug in GreaseMonkey that makes it not run inside IFRAMEs, but it runs fine inside EMBEDs and OBJECTs.
	ApiFrame.data = "https://api.nextdns.io/configurations/#" + location.href.split("/")[3]  // To pass the config ID to the frame directly from the URL. This ensures that the frame will receive this data as soon as possible.
	document.body.appendChild(ApiFrame)
	ApiFrame.style = "display: none;"	 // The frame needs to be hidden *after* the append, otherwise Chrome won't load it. In Firefox it works fine.



	function main()
	{
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
								// Setup the devices dropdown
								
								if (typeof otherDevices == "undefined")
								{
									waitForDropdown = setInterval(function()
									{
										devicesDropdown = document.getElementById("root").children[1].getElementsByClassName("dropdown")[0].querySelector("button:not([disabled])")

										if (devicesDropdown)
										{
											clearInterval(waitForDropdown)
											
											devicesDropdown = devicesDropdown.parentElement
											
											devicesDropdown.firstChild.click()  // Load the list of devices
											
											// Clone the devices dropdown and use it as a visual representation of the original. This makes it much easier to customize and more reliable
											
											customDevicesDropdown = devicesDropdown.cloneNode(true)
											devicesDropdown.style.cssText += "display: none;"
											customDevicesDropdown.classList.remove("show")
											customDevicesDropdown.lastChild.classList.remove("show")
											customDevicesDropdown.lastChild.style.cssText += "top: 40px; opacity: 1; pointer-events: initial;"
											customDevicesDropdown.onclick = function()
											{
												const classes = this.lastChild.classList
												
												if (!classes.contains("show"))
													classes.add("show")
												else classes.remove("show")
											}
											
											devicesCustom = customDevicesDropdown.lastChild.children
											
											// When clicking on a device in the custom devices dropdown, click on the respective device in the original devices dropdown
											
											for (i=0; i < devicesCustom.length; i++)
											{
												devicesCustom[i].removeAttribute("href")
												devicesCustom[i].onclick = function()
												{
													const index = Array.from(this.parentElement.children).indexOf(this)
													const devices = this.parentElement.parentElement.previousSibling.lastChild.children
													
													devices[index].click()
													
													this.parentElement.querySelector(".active").classList.remove("active")
													this.classList.add("active")
													
													this.parentElement.previousSibling.innerHTML = this.firstChild.innerHTML
													
													hideDevices = false
												}
											}
											
											devicesDropdown.parentElement.appendChild(customDevicesDropdown)
											
											
											// Create the "Other devices" button
											
											otherDevices = document.createElement("button")
											otherDevices.className = "dropdown-item"
											otherDevices.style = "border-top: 1px solid lightgray;"  // Separator
											otherDevices.innerHTML = "Other devices"
											otherDevices.onclick = function()
											{
												devicesDropdown.lastChild.firstChild.click()   // All devices. Use the full log to filter the devices
												customDevicesDropdown.firstChild.innerHTML = "Other devices"
												this.parentElement.querySelector(".active").classList.remove("active")
												this.classList.add("active")
												hideDevices = true
											}
										
											customDevicesDropdown.lastChild.appendChild(otherDevices)
											
										}
										
									}, 100)
									
								}


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
											enableFilteringSwitch.style.cssText += "visibility: visible;"
										}
										else  // If it's clicked the second time
										{
											updateFilters()
											domainsToHideInput.style.cssText += "visibility: hidden;"
											this.innerHTML = "Filters"
											this.className = this.className.replace("primary", "secondary")
											enableFilteringSwitch.style.cssText += "visibility: hidden;"
										}
									}


									// Create the "Enable filtering" switch

									enableFilteringSwitch = createSwitchCheckbox("Enable filtering")
									enableFilteringSwitch.style.cssText += "position: absolute; right: -140px; top: -15px; visibility: hidden;"
									enableFilteringSwitch.firstChild.checked = true
									enableFilteringSwitch.onchange = function()
									{
										filtering = enableFilteringSwitch.firstChild.checked

										if (typeof customDevicesDropdown != "undefined")
										{
											const currentDevice = customDevicesDropdown.querySelector(".active")
											currentDevice.click()
											currentDevice.parentElement.classList.remove("show")  // Prevent the list from appearing because of the click()
										}
									}


									// Create the filter's inputbox

									domainsToHideInput = document.createElement("textarea")
									domainsToHideInput.spellcheck = false
									domainsToHideInput.value = domainsToHide.join("\n")
									domainsToHideInput.style = "position: absolute; left: 1140px; top: 15px; width: 320px; height: 240px; min-width: 250px; min-height: 100px; border-radius: 15px; border: 1px groove lightgray; \
																outline: 0px; padding-left: 10px; padding-right: 5px; padding-top: 5px; visibility: hidden; resize: both; overflow-wrap: normal;"

									const container = document.getElementById("root").children[1].firstChild.firstChild
									container.style.cssText += "position: relative;"
									container.appendChild(filtersButton)
									container.appendChild(domainsToHideInput)
									container.appendChild(enableFilteringSwitch)
								}


								function updateFilters()
								{
									GM.setValue("domainsToHide", domainsToHideInput.value)
									domainsToHide = domainsToHideInput.value.split("\n").filter(d => d.trim() != "") // Don't include empty lines

									if (selector.includes(":not(.processed)"))
										selector = selector.replace(":not(.processed)", "") // Reinclude already processed queries so that it can refilter in realtime
								}


								// Create the allow/deny popup

								if (typeof allowDenyPopup == "undefined")
								{
									const elementsContainer = document.createElement("div")
									elementsContainer.onclick = function() { event.stopPropagation() }  // Prevent the popup from being hidden when clicking inside it
									elementsContainer.style = "background: #f7f7f7; position: absolute; right: 130px; height: max-content; width: max-content; \
															   border: 2px solid lightgray; border-radius: 15px; z-index: 99; padding: 5px 15px 15px 15px; visibility: hidden;"

									const errorMsgSpan = document.createElement("span")
									errorMsgSpan.style = "display: block; min-height: 25px; line-height: 20px; margin-top: 0px;"
									errorMsgSpan.className = "ml-1 mb-1 mt-1 invalid-feedback"

									const input = document.createElement("input")
									input.style = "border-radius: 5px; width: 300px; padding: 5px;"
									input.className = "form-control mb-3"
									input.onkeyup = function()
									{
										if (event.key == "Enter")  allowDenyPopup.fullDomainButton.click()
										else if (event.key == "Escape")	 allowDenyPopup.container.style.cssText += 'visibility: hidden;'
									}
									input.oninput = function(event)
									{
										this.classList.remove("is-invalid")
										this.previousSibling.innerHTML = ""
									}

									const fullDomainButton = document.createElement("button")
									fullDomainButton.onclick = function()
									{
										allowDenyPopup.errorMsg.classList.remove("invalid-feedback")

										if (allowDenyPopup.listName != "Hide")
										{
											allowDenyPopup.errorMsg.innerHTML = "Submitting..."

											makeAPIrequest(allowDenyPopup.listName + "/hex:" + convertToHex(allowDenyPopup.input.value), "PUT", `(function()
											{
												if (e.data.response.includes(allowDenyPopup.input.value))
												{
													allowDenyPopup.errorMsg.innerHTML = 'Done!'

													setTimeout(function() {
														allowDenyPopup.container.style.cssText += 'visibility: hidden;'
														allowDenyPopup.errorMsg.innerHTML = ''
													}, 1000)

													makeAPIrequest(allowDenyPopup.listName, "GET", "allowDenyPopup.domainsList[allowDenyPopup.listName] = e.data.response")
												}
												else if (e.data.response.includes("error"))
												{
													allowDenyPopup.errorMsg.innerHTML = JSON.parse(e.data.response).error
													allowDenyPopup.errorMsg.classList.add("invalid-feedback")
													allowDenyPopup.input.classList.add("is-invalid")
												}
											})()`)
										}
										else
										{
											domainsToHideInput.value += "\n" + allowDenyPopup.input.value
											updateFilters()
											allowDenyPopup.errorMsg.innerHTML = 'Done!'

											setTimeout(function() {
												allowDenyPopup.container.style.cssText += 'visibility: hidden;'
											}, 1000)
										}
									}

									const rootDomainButton = document.createElement("button")
									rootDomainButton.style = "width: 127px; float: right;"
									rootDomainButton.onclick = function()
									{
										let input = allowDenyPopup.input
										input.value = this.title.substring(this.title.indexOf("*") + 2)  // Instead of parsing the root domain again, get it from the title set by the Allow/Deny/Hide buttons

										if (allowDenyPopup.listName == "Hide")
											input.value = "." + input.value  // Add a dot before the root domain to prevent false positives

										allowDenyPopup.fullDomainButton.click()
									}

									elementsContainer.appendChild(errorMsgSpan)
									elementsContainer.appendChild(input)
									elementsContainer.appendChild(fullDomainButton)
									elementsContainer.appendChild(rootDomainButton)

									const logsContainer = document.getElementsByClassName("list-group")[0].parentElement
									logsContainer.appendChild(elementsContainer)


									allowDenyPopup = {
										parent: logsContainer,
										container: elementsContainer,
										errorMsg: errorMsgSpan,
										input: input,
										fullDomainButton: fullDomainButton,
										rootDomainButton: rootDomainButton,
										listName: "",
										domainsList: {
											allowlist: "",
											denylist: ""
										}
									}
									
									document.body.onclick = function() { elementsContainer.style.cssText += 'visibility: hidden;' }


									// Get the list of domains in the allowlist, then get the list of domains in the denylist									
									makeAPIrequest("allowlist", "GET", 'allowDenyPopup.domainsList.allowlist = e.data.response; \
																		makeAPIrequest("denylist", "GET", "allowDenyPopup.domainsList.denylist = e.data.response")'
									)

								}


								// Process the queries

								let visibleQueries = 0

								for (let i = 0; i < queries.length; i++)
								{
									const currentDomain = queries[i].textContent + queries[i].nextSibling.textContent
									const listItemSpace = queries[i].parentElement.parentElement
									const listItem = listItemSpace.parentElement
									const deviceNameElem = listItemSpace.nextSibling.firstChild.lastChild
									let deviceName = deviceNameElem.textContent.trim()

									if ((filtering && !currentDomain.includes("."))	// Chrome's random queries
										|| (hideDevices && deviceName != "")   // If enabled, named devices. Queries from unnamed devices just have a whitespace
										|| (filtering && domainsToHide.some(d => currentDomain.includes(d))) )   // If enabled, domains included in the list of domains to hide
									{
										listItem.style = "display:none"
										listItem.className = ""
										queries[i].className = "processed"
										continue
									}

									visibleQueries++



									// Create the Hide/Allow/Deny buttons

									if (!queries[i].className.includes("processed"))	// Prevent the buttons from being added again when reprocessed
									{
										const hide = document.createElement("button")
										hide.className = "btn btn-secondary"
										hide.innerHTML = "Hide"
										hide.style = "position: absolute; right: 450px; visibility: hidden;"
										setOnClickButton(hide)

										const deny = document.createElement("button")
										deny.className = "btn btn-danger"
										deny.innerHTML = "Deny"
										deny.style = "position: absolute; right: 350px; visibility: hidden;"
										setOnClickButton(deny)

										const allow = document.createElement("button")
										allow.className = "btn btn-success"
										allow.innerHTML = "Allow"
										allow.style = "position: absolute; right: 250px; visibility: hidden;"
										setOnClickButton(allow)

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

								if (window.innerWidth == document.body.clientWidth && (document.body.clientHeight / window.innerHeight * 100) < 90)  // If there is no vertical scrollbar and the page's height takes less than 90% of the window height,
								{																													 // then surely the body height is insufficient to trigger the infinite scroll
									const dummyTallEll = document.createElement("div") // Create a temporary element to fill the empty space
									dummyTallEll.style.cssText = "height: " + (window.innerHeight - 300) + "px;"	// A static value is insufficient for big resolutions. This makes it relative to the window size
									document.getElementById("root").children[1].firstChild.getElementsByClassName("list-group")[0].appendChild(dummyTallEll)
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

								if (typeof checkQueriesTime != "undefined")
									clearInterval(checkQueriesTime)

								function addAbsoluteTime()
								{
									const relativeQueries = document.getElementsByClassName("visible")

									for (i=0; i < relativeQueries.length; i++)
									{
										const time = relativeQueries[i].querySelector("time")

										if (/ago|in/.test(time.textContent) && !time.textContent.includes(":"))
											time.innerHTML = time.innerText + "&nbsp; (" + new Date(+time.attributes["datetime"].value).toLocaleTimeString() + ")"
										else if (time.textContent.includes("202"))
											break	 // Stop when there's no more queries with relative time
									}
								}

								addAbsoluteTime()

								checkQueriesTime = setInterval( function() { addAbsoluteTime() }, 3000)	 // NextDNS site overwrites the time element every minute, so this needs to be repeated

								intervals.push(checkQueriesTime)

							}
						}

					}, 500)

					intervals.push(waitForItems)


					function setOnClickButton(button)
					{
						button.onclick = function()
						{
							const domainContainer = this.parentElement.firstChild
							const fullDomain = domainContainer.children[1].textContent + domainContainer.children[2].textContent	// Subdomains + root domain
							let upperDomain =
							allowDenyPopup.input.value = fullDomain

							allowDenyPopup.errorMsg.classList.remove("invalid-feedback")
							allowDenyPopup.input.classList.remove("is-invalid")
							allowDenyPopup.errorMsg.innerHTML = ""

							if (this.innerText != "Hide")
							{
								allowDenyPopup.listName = this.innerText.toLowerCase() + "list"

								while (upperDomain.indexOf(".") >= 0)
								{
									upperDomain = upperDomain.substring(upperDomain.indexOf(".") + 1)

									if (allowDenyPopup.domainsList[allowDenyPopup.listName].includes('"' + upperDomain + '"'))
									{
										allowDenyPopup.errorMsg.innerHTML = "This subdomain is already included in another entry!"
										allowDenyPopup.input.classList.add("is-invalid")
										allowDenyPopup.errorMsg.classList.add("invalid-feedback")

										break
									}
								}
							}
							else allowDenyPopup.listName = "Hide"

							const subdomains = allowDenyPopup.input.value.split(".")
							let rootDomain = subdomains[subdomains.length-2]

							if (SLDs.includes(rootDomain))
								rootDomain = subdomains[subdomains.length-3] + "." + rootDomain

							rootDomain += "." + subdomains[subdomains.length-1]

							allowDenyPopup.rootDomainButton.title = this.innerText + " any subdomain under *." + rootDomain


							allowDenyPopup.fullDomainButton.className =
							allowDenyPopup.rootDomainButton.className = this.innerText == "Allow" ? "btn btn-success mt-1" : this.innerText == "Deny" ? "btn btn-danger mt-1" : "btn btn-secondary mt-1"

							allowDenyPopup.fullDomainButton.innerHTML = this.innerText + " domain"
							allowDenyPopup.rootDomainButton.innerHTML = this.innerText + " root"

							allowDenyPopup.container.style.cssText += "visibility: visible; top: " + (this.getBoundingClientRect().y - allowDenyPopup.parent.getBoundingClientRect().y - 170) + "px;"	 // Show the popup right above the buttons
							allowDenyPopup.input.focus()
							event.stopPropagation()	  // Don't raise this event to the body, as the body hides the popup when clicked

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
											if (confirm("This may take several minutes (1 minute in ideal conditions). Are you sure?"))
											{
												const buttons = document.querySelectorAll(".modal-body .btn-primary")

												i=0
												addAllInterval = setInterval(function()	  // Here an interval is being used instead of a for, because a for makes the browser freeze while doing this
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


							// Create the options menu

							const sortTLDSwitch = createSwitchCheckbox("Sort by TLD")

							const boldRootSwitch = createSwitchCheckbox("Bold root domain")
							boldRootSwitch.firstChild.checked = GMsettings.AllowDenyOptions.bold
							boldRootSwitch.onchange = function()
							{
								styleDomains("bold", this.firstChild.checked)
								GMsettings.AllowDenyOptions.bold = this.firstChild.checked
								GM.setValue("AllowDenyOptions", JSON.stringify(GMsettings.AllowDenyOptions))
							}

							const lightenSwitch = createSwitchCheckbox("Lighten subdomains")
							lightenSwitch.firstChild.checked = GMsettings.AllowDenyOptions.lighten
							lightenSwitch.onchange = function()
							{
								styleDomains("lighten", this.firstChild.checked)
								GMsettings.AllowDenyOptions.lighten = this.firstChild.checked
								GM.setValue("AllowDenyOptions", JSON.stringify(GMsettings.AllowDenyOptions))
							}

							const rightAlignSwitch = createSwitchCheckbox("Right-aligned")
							rightAlignSwitch.firstChild.checked = GMsettings.AllowDenyOptions.rightAligned
							rightAlignSwitch.onchange = function()
							{
								styleDomains("rightAlign", this.firstChild.checked)
								GMsettings.AllowDenyOptions.rightAligned = this.firstChild.checked
								GM.setValue("AllowDenyOptions", JSON.stringify(GMsettings.AllowDenyOptions))
							}


							const optionsContainer = document.createElement("div")
							optionsContainer.style = "position:absolute; top: 7px; border: 1px solid lightgray; border-radius: 15px; padding: 5px 15px 5px 0px; left: 1160px; width: max-content; display: none;"
							optionsContainer.appendChild(sortTLDSwitch)
							optionsContainer.appendChild(boldRootSwitch)
							optionsContainer.appendChild(lightenSwitch)
							optionsContainer.appendChild(rightAlignSwitch)

							const optionsButton = document.createElement("button")
							optionsButton.className = "btn btn-clear"
							optionsButton.style = "position:absolute; right: -42px; bottom: 10px; width: 30px; padding: 1px 0px 3px 3px; border: 1px solid lightgray;"
							optionsButton.innerHTML = "⚙️"
							optionsButton.onclick = function() {
								optionsContainer.style.cssText += optionsContainer.style.cssText.includes("none") ? "display: initial;" : "display: none;"
								this.blur()
							}

							const sortAZButton = document.createElement("button")
							sortAZButton.className = "btn btn-primary"
							sortAZButton.style = "position: absolute; right: 20px; bottom: 6px"
							sortAZButton.innerHTML = "Sort A-Z"
							sortAZButton.onclick = function() { sortItemsAZ(".list-group:nth-child(2)", "domain", sortTLDSwitch.firstChild); this.blur() }

							const rectangleAboveInput = document.querySelector(".list-group")
							rectangleAboveInput.style = "position: relative;"
							rectangleAboveInput.appendChild(optionsContainer)
							rectangleAboveInput.appendChild(optionsButton)
							rectangleAboveInput.appendChild(sortAZButton)
							rectangleAboveInput.onclick = function() { event.stopPropagation() }

							document.body.onclick = function() { optionsContainer.style.cssText += 'display: none;' }


							// Create the input box for the domain descriptions

							const domainsItems = document.querySelectorAll(".list-group-item")

							for (i=1; i < domainsItems.length; i++)
							{
								const descriptionInput = document.createElement("input")
								descriptionInput.className = "description"
								descriptionInput.placeholder = "Add a description. Press Enter to submit"
								descriptionInput.style = "margin-left: 40px; border: 0; background: transparent; color: gray;"
								descriptionInput.onkeypress = function(event)
								{
									if (event.key == "Enter")
									{
										GMsettings.domainDescriptions[this.previousSibling.textContent.substring(2)] = this.value
										GM.setValue("domainDescriptions", JSON.stringify(GMsettings.domainDescriptions))
										this.style.cssText += this.value != "" ? "visibility: visible;" : "visibility: hidden;"
										this.blur()
									}
								}

								descriptionInput.value = GMsettings.domainDescriptions[domainsItems[i].textContent.substring(2)] || ""

								if (descriptionInput.value == "")
									descriptionInput.style.cssText += "visibility: hidden;"

								domainsItems[i].firstChild.firstChild.appendChild(descriptionInput)

								descriptionInput.style.cssText += "width: " + (descriptionInput.parentElement.getBoundingClientRect().width - descriptionInput.previousSibling.getBoundingClientRect().width - 41) + "px;"	// Make the input box take all available space
							}


							// Apply the highlighting options

							styleDomains("bold", boldRootSwitch.firstChild.checked)
							styleDomains("lighten", lightenSwitch.firstChild.checked)

							if (rightAlignSwitch.firstChild.checked)
								styleDomains("rightAlign", rightAlignSwitch.firstChild.checked)

						}

					}, 500)

					intervals.push(waitForLists)

				}

			}


		}, 500)
	}





	function getGMsettings()
	{
		GMsettings = new Object()
		ind = 0
		settings = ["domainDescriptions", "AllowDenyOptions"]

		GM.getValue("changed").then(function(value)
		{
			if (value != true)
			{
				GM.setValue("domainsToHide", "nextdns.io\n.in-addr.arpa")   // Hide theses queries by default, but only at the first time
				GM.setValue("changed", true)
			}

			GM.getValue("domainsToHide").then(function(value)
			{
				domainsToHide = value.split("\n").filter(d => d.trim() != "")  // Create an array with the domains to be hidden, excluding empty lines

				getOrCreateGMsetting(settings[0])
			})
		})

	}


	function getOrCreateGMsetting(settingName)
	{
		GM.getValue(settingName).then(function(value)
		{
			if (value == undefined)
			{
				GMsettings[settingName] = new Object()
				GM.setValue(settingName, JSON.stringify(GMsettings[settingName]))
			}
			else GMsettings[settingName] = JSON.parse(value)

			ind++

			if (ind < settings.length)
				getOrCreateGMsetting(settings[ind])	 // This is to make sure that all settings are loaded before the interval starts
			else
				main()

		})
	}


	SLDs = ["co","com","org","edu","gov","mil","net"]

	function styleDomains(type, enable)
	{
		if (type == "lighten" || type == "bold")
		{
			const items = document.querySelectorAll(".list-group-item span[class='notranslate']")

			for (i=0; i < items.length; i++)
			{
				const rootSpan = items[i].querySelector("span + span")

				if (enable)
				{
					const subdomains = items[i].textContent.split(".")
					let rootDomain = subdomains[subdomains.length-2]
					let domainStyle = "color: black;"

					if (type == "lighten")
						items[i].style.cssText += "color: #aaa"
					else
						domainStyle += "font-weight: bold;"

					if (SLDs.includes(rootDomain))
						rootDomain = subdomains[subdomains.length-3] + "." + rootDomain

					rootDomain += "." + subdomains[subdomains.length-1]

					if (!rootSpan)
						items[i].innerHTML = items[i].innerHTML.replace(rootDomain, "<span style='" + domainStyle + "'>" + rootDomain + "</span>")
					else
						rootSpan.style.cssText += domainStyle

				}
				else
				{
					if (rootSpan)
					{
						if (type == "lighten")
						{
							rootSpan.style.cssText += "color: inherit;"
							items[i].style.cssText += "color: inherit;"
						}
						else rootSpan.style.cssText += "font-weight: normal;"
					}
				}
			}
		}
		else if (type == "rightAlign")
		{
			const domainContainers = document.querySelectorAll(".list-group-item > div > div:nth-child(1)")
			for (i=0; i < domainContainers.length; i++)
			{
				const favicon = domainContainers[i].firstChild.querySelector("img")
				favicon.className = enable ? "ml-2" : "mr-2"
				domainContainers[i].firstChild.appendChild(domainContainers[i].firstChild.firstChild) // Swap places for the favicon and domain
				domainContainers[i].style.cssText += enable ? "justify-content: flex-end;" : "justify-content: initial;"
				domainContainers[i].lastChild.style.cssText += "width: 450px;"
			}
		}
	}


	function createSwitchCheckbox(inner)
	{
		const container = document.createElement("div")
		container.className = "custom-switch"

		const checkbox = document.createElement("input")
		checkbox.type = "checkbox"
		checkbox.id = "id" + Date.now() * Math.random()	  // There's no need to specify a human-readable id, but it needs to be unique
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
			let startingLevel = 1	 // From last to first

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
					if (SLDs.includes(tempA[levelA]))	 // If the domain before the TLD is a SLD, instead of a root domain ...
						a = tempA[--levelA]			     // ... skip it.

					if (SLDs.includes(tempB[levelB]))
						b = tempB[--levelB]
				}

				while(true)	 // Repeat until reaching a return
				{
					if		(a <  b) return -1
					else if (a >  b) return 1
					else if (a == b)	// If both items share the same domain ...
					{
						levelA--	    // ... then skip to a deeper level ...
						levelB--

						if (typeof tempA[levelA] != "undefined" && typeof tempB[levelB] != "undefined")	 // ... but only if both have a deeper level.
						{
							a = tempA[levelA]
							b = tempB[levelB]
						}
						else if (typeof tempA[levelA] == "undefined" && typeof tempB[levelB] != "undefined")  // This happens when an upper level domain is compared with a deeper level one.
							return -1																	      // In this case, bring the upper level one to the top
						else if (typeof tempA[levelA] != "undefined" && typeof tempB[levelB] == "undefined")
							return 1
						else return 0
					}
				}
			})
		}
		else  // Simple sorting
		{
			items.sort(function(a, b)
			{
				a = a.textContent.toLowerCase()
				b = b.textContent.toLowerCase()

				if		(a <  b) return -1
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

		otherDevices  = undefined   // Force destroy when the page is changed
		filtersButton = undefined
		domainsToHideInput = undefined
		allowDenyPopup = undefined
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
		show.style = "position: absolute; right: 200px; top: 30px;"
		show.innerHTML = text
		show.onclick = function() {
			for (let i = 1; i < items.length; i++)
				items[i].style.cssText += "display: block;"
		}

		items[0].style += "position: relative;"
		items[0].appendChild(show)
	}


	function convertToHex(string)
	{
		let hex = ""

		for (let i=0; i < string.length; i++)
			hex += string.charCodeAt(i).toString(16)

		return hex
	}



	function makeAPIrequest(requestString, HTTPmethod, callback = "")
	{
		// The callback is code as string which is handed over the chain: top window's makeAPIrequest > frame's message listener > frame's makeRequest function > top window's message listener > callback.
		// Because the HTTP request is made asynchronously, this ensures that the callback is executed only after this whole chain is completed. None of this is needed with a synchronous request, but when the connection gets slow, it freezes the browser until it's completed
	
		window.frames[0].postMessage({request: requestString, method: HTTPmethod, callback: callback}, "https://api.nextdns.io")
	}




}
else if (location.href.includes("https://api.nextdns.io/"))
{
	// This function needs to be in the frame's body, otherwise the request is refused due to CORS

	const script = document.createElement("script")
	script.innerHTML = `
		configID = location.href.split("/")[4].replace("#", "")

		function makeRequest(requestString, HTTPmethod, callback)
		{
			const requestURL = configID + "/" + requestString

			xmlHttp = new XMLHttpRequest()
			xmlHttp.open(HTTPmethod, requestURL)
			xmlHttp.onload = function() { window.top.postMessage({response: xmlHttp.response, callback: callback}, "https://my.nextdns.io") }
			xmlHttp.onerror = function() { alert("Couldn't reach the server!") }
			xmlHttp.send()
		}
	`

	document.head.appendChild(script)

	window.addEventListener("message", function (e) {
		unsafeWindow.makeRequest(e.data.request, e.data.method, e.data.callback)
	}, false)


}
