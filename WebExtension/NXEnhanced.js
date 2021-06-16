// Name            NX Enhanced
// Description     Adds quality-of-life features to NextDNS website for a more practical experience
// Author          BLBC (github.com/hjk789, addons.mozilla.org/user/10772492)
// Homepage        https://github.com/hjk789/NXEnhanced
// License         https://github.com/hjk789/NXEnhanced#license
// SupportURL      https://github.com/hjk789/NXEnhanced/issues
// Copyright (c) 2020+ BLBC (github.com/hjk789)

let currentPage = ""
const intervals = []

const isChrome = typeof browser == "undefined"      // Whether it's Chrome. Chrome uses the chrome object, while Firefox and Edge use the browser object.


// Load all NX Enhanced's settings
loadNXsettings()

// Add some internal functions to the code
extendFunctions()

// Add some simple styles for a better UX
const style = document.createElement("style")
style.innerHTML = `.list-group-item:hover .btn { visibility: visible !important; }                                     /* Allow/Deny/Hide buttons on hover */
                   .tooltipParent:hover .customTooltip { opacity: 1 !important; visibility: visible !important; }      /* Show the tooltip when hovering it's container */
                   .tooltipParent .customTooltip:hover { opacity: 0 !important; visibility: hidden !important; }       /* Hide the tooltip when it's hovered, as it should stay visible only when hovering the parent */
                    div:hover #counters { visibility: hidden !important; }                                             /* Hide the log entries counters on hover */
                   .btn-light { background-color: #eee; }                                                              /* Make the btn-light more visible without affecting the hover */
                   .list-group-item:hover input.description, input.description:focus { display: initial !important;}   /* Show the allow/denylist domains description input box on hover, and when the input is focused */
                  `
document.head.appendChild(style)


// Polling to check when the user switches pages, to add the features of the respective page.
waitForPageSwitchings = setIntervalOld(function()
{
    if (currentPage == location.href)
        return

    if (/\/logs/i.test(location.href) && currentPage && location.href.split("/")[3] != currentPage.split("/")[3])      // If the user switches to another config while in the Logs page, refresh the page automatically.
    {                                                                                                                  // In the lack of a better way, this seems to be the least error prone solution.
        clearInterval(waitForPageSwitchings)
        location.reload()
        return
    }

    currentPage = location.href

    clearAllIntervals()

    if (typeof rowStyle != "undefined")     // The row style is only needed in the Logs page, so it should be removed when switching pages.
        rowStyle.remove()

    main()

}, 250)




function main()
{
    // ---------------------------- Logs page ----------------------------


    if (/\/logs/i.test(location.href))
    {
        let hideDevices = false, filtering = true
        let loadingChunk = false, cancelLoading = false
        let logsContainer, allowDenyPopup, existingEntries, updateRelativeTimeInterval
        let visibleEntriesCountEll, filteredEntriesCountEll, allHiddenEntriesCountEll, loadedEntriesCountEll
        let lastBefore, lastAfter = 1, currentDeviceId, searchString, searchItems, blockedQueriesOnly, simpleLogs = 1
        const dateTimeFormatter = new Intl.DateTimeFormat('default', { weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "numeric", second: "numeric" });

        const waitForItems = setInterval(function()
        {
            // Wait for some elements to finish loading
            {
                var pageContentContainer = document.getElementById("root").secondChild()

                if (!pageContentContainer)
                    return

                logsContainer = pageContentContainer.getByClass("list-group")

                if (!logsContainer)
                    return

                const svgs = logsContainer.querySelectorAll(".settings-button svg, .stream-button svg")

                if (svgs.length < 2)                                                        // Wait for the SVGs to finish loading before overriding, otherwise they fail to load and leave a blank space.
                    return

                let searchBarForm = logsContainer.querySelector("form")

                if (!searchBarForm || !logsContainer.querySelector("div.text-center"))      // Wait for the search bar and the first log row to finish loading before overriding.
                    return


                clearInterval(waitForItems)
            }


            pageContentContainer.firstChild.outerHTML += ""                             // Override the content container code (reparse) to remove all events attached and invalidate all references to it, so it can be used statically (without interferences from other scripts).

            logsContainer = pageContentContainer.getByClass("list-group")               // Update the "pointer" to the new instance.


            // Add a min-width to help the log entries and the filtering options be more responsive on narrow windows

            rowStyle = document.createElement("style")
            rowStyle.innerHTML = ".row { min-width: 670px; }"
            document.head.appendChild(rowStyle)


            // Setup the devices dropdown
            {
                const waitForDropdown = setInterval(function()
                {
                    let devicesDropdown = pageContentContainer.getByClass("dropdown")

                    if (!devicesDropdown)
                        return

                    clearInterval(waitForDropdown)

                    let customDevicesDropdown = devicesDropdown.parentElement

                    customDevicesDropdown = customDevicesDropdown.firstChild
                    customDevicesDropdown.id = "customDevicesDropdown"
                    customDevicesDropdown.firstChild.disabled = false
                    customDevicesDropdown.firstChild.style.pointerEvents = "initial"
                    customDevicesDropdown.onclick = function()
                    {
                        const classes = this.lastChild.classList

                        if (!classes.contains("show"))
                            classes.add("show")
                        else classes.remove("show")
                    }

                    const devicesDropdownMenu = document.createElement("div")
                    devicesDropdownMenu.className = "dropdown-menu"
                    customDevicesDropdown.appendChild(devicesDropdownMenu)


                    // Get the devices IDs to use for loading the log entries of specific devices. In NextDNS, each device has a randomly
                    // generated ID (just like the config ID), and this ID is used as parameter to request the log entries of specific devices.
                    // NX Enhanced loads the log entries by itself instead of letting the site load them, because this way NX Enhanced has access to the log entries' raw data instead of having to depend on what the page
                    // actually shows, which can change anytime and require constant adaptations for every layout or code change. Also, this makes it possible to implement other features to the logs that require such access.

                    const requestString = "analytics/top_devices?selector=true"
                    makeApiRequest("GET", requestString, function(response)
                    {
                        const devicesData = JSON.parse(response)

                        for (let i=0; i < devicesData.length + 1; i++)
                        {
                            const deviceCustom = document.createElement("button")
                            deviceCustom.className = i == 0 ? "dropdown-item active" : "dropdown-item"
                            deviceCustom.textContent = i == 0 ? "All devices" : devicesData[i-1].name
                            deviceCustom.onclick = function()       // Although the event doesn't appear in Firefox's DOM Inspector, the function is called normally.
                            {
                                const index = Array.from(this.parentElement.children).indexOf(this)     // Get the index of this dropdown item.

                                cancelLoading = true                // Indicates that the chunk currently being loaded should be interrupted.

                                if (index == 0)                     // If it's the "All devices" item.
                                {
                                    currentDeviceId = ""
                                    reloadLogs()
                                }
                                else                                // If instead it's a specific device.
                                {
                                    currentDeviceId = devicesData[index-1].id
                                    loadLogChunk({device: currentDeviceId, clear: true})
                                }


                                // Update the current device selected

                                this.parentElement.querySelector(".active").classList.remove("active")
                                this.classList.add("active")

                                this.parentElement.previousSibling.textContent = this.textContent

                                hideDevices = false
                                allHiddenEntriesCountEll.parentElement.style.display = "none"
                            }

                            devicesDropdownMenu.appendChild(deviceCustom)
                        }

                        // Create the "Other devices" button

                        const otherDevicesBtn = document.createElement("button")
                        otherDevicesBtn.className = "dropdown-item"
                        otherDevicesBtn.id = "otherDevicesBtn"
                        otherDevicesBtn.style = "border-top: 1px solid lightgray;"  // Separator
                        otherDevicesBtn.innerHTML = "Other devices"
                        otherDevicesBtn.onclick = function()
                        {
                            this.parentElement.firstChild.click()       // Click the "All devices" button. Use the full log to filter the devices

                            customDevicesDropdown.firstChild.innerHTML = "Other devices"
                            this.parentElement.querySelector(".active").classList.remove("active")
                            this.classList.add("active")
                            hideDevices = true
                            allHiddenEntriesCountEll.parentElement.style.display = "initial"
                        }

                        devicesDropdownMenu.appendChild(otherDevicesBtn)

                    })



                }, 100)

            }


            // Setup the "List queries before" feature
            {
                const loadBeforeContainer = document.createElement("div")
                loadBeforeContainer.textContent = "List queries before: "
                loadBeforeContainer.style = "align-items: center; display: flex;"

                // Create the date inputbox
                {
                    const loadBeforeInput = document.createElement("input")
                    loadBeforeInput.className = "form-control form-control-sm mx-3"
                    loadBeforeInput.style = "border-radius: 16px; width: initial;"
                    loadBeforeInput.value = new Date().toLocaleString().replace(/(202\d),/,"$1")        // Set the input's value as the current date-time in the user's locale, without the comma after the year.
                    loadBeforeInput.onkeyup = function()
                    {
                        if (event.key == "Enter")
                            this.nextSibling.click()
                    }

                    loadBeforeContainer.appendChild(loadBeforeInput)
                }


                const isDDMM = new Date(new Date().setDate(25)).toLocaleString().split("/").indexOf("25") == 0     // Get whether the user's locale date format has the day in the first position, to use it below.

                // Create the "Go" button
                {
                    var loadBeforeGoButton = document.createElement("button")
                    loadBeforeGoButton.className = "btn btn-primary"
                    loadBeforeGoButton.style = "margin-right: 50px; padding-top: 3px; height: 34px;"
                    loadBeforeGoButton.textContent = "Go"
                    loadBeforeGoButton.onclick = function()
                    {
                        let date = this.previousSibling.value
                        let datesplit

                        if (date.includes(" "))
                            datesplit = date.split(" ")[0].split("/")
                        else
                            datesplit = date.split("/")

                        // When parsing the date, only the YYYY/MM/DD and MM/DD/YYYY formats are recognized correctly,
                        // so to parse the date in DD/MM/YYYY format it's required to swap the day and month.

                        if (isDDMM)
                        {
                            const day = datesplit[0]
                            const month = datesplit[1]

                            datesplit[0] = month
                            datesplit[1] = day
                        }

                        datesplit = datesplit.join("/")

                        if (date.includes(" "))
                            date = datesplit + " " + date.split(" ")[1]
                        else
                            date = datesplit

                        const specifiedDateTimeInUnixEpoch = Date.parse(date)

                        reloadLogs({before: specifiedDateTimeInUnixEpoch})
                    }

                    loadBeforeContainer.appendChild(loadBeforeGoButton)
                }


                const container = pageContentContainer.firstChild.firstChild
                container.style.minWidth = "750px"
                container.appendChild(loadBeforeContainer)
            }


            // Setup the filtering's buttons and inputs
            {
                // Create the "Filters" button
                {
                    const filtersButton = document.createElement("button")
                    filtersButton.id = "filtersButton"
                    filtersButton.className = "btn btn-secondary"
                    filtersButton.style = "align-self: center; margin-right: 15px;"
                    filtersButton.innerHTML = "Filters"
                    filtersButton.onclick = function()
                    {
                        event.stopPropagation()

                        if (this.className.includes("secondary"))
                        {
                            filteringOptionsContainer.style.visibility = "visible"
                            filteringOptionsContainer.style.position = "relative"
                            pageContentContainer.firstChild.style = "max-width: 1460px;"        // Sum the filtering options width to the page content container max-width, so the logs container don't get squished when the options are expanded.
                            this.innerHTML = "OK"
                            this.className = this.className.replace("secondary", "primary")
                        }
                        else        // If it's clicked the second time.
                        {
                            updateFilters()
                            filteringOptionsContainer.style.visibility = "hidden"
                            filteringOptionsContainer.style.position = "absolute"       // Here the position is set to absolute so that it doesn't take space when invisible, as altering the content of a "display: none" input can cause some bugs.
                            pageContentContainer.firstChild.style = "max-width: 1140px;"
                            this.innerHTML = "Filters"
                            this.className = this.className.replace("primary", "secondary")
                        }
                    }

                    pageContentContainer.firstChild.firstChild.appendChild(filtersButton)
                }


                // Create the filtering options
                {
                    var filteringOptionsContainer = document.createElement("div")
                    filteringOptionsContainer.style = "position: absolute; visibility: hidden; display: grid; grid-gap: 10px; margin-bottom: 20px; float: right;"
                    filteringOptionsContainer.onclick = function() { event.stopPropagation() }


                    // Create the "Enable filtering" switch
                    {
                        const enableFilteringSwitch = createSwitchCheckbox("Enable filtering")
                        enableFilteringSwitch.style.marginLeft = "-7px"
                        enableFilteringSwitch.firstChild.checked = true
                        enableFilteringSwitch.firstChild.onchange = function()
                        {
                            filtering = this.checked

                            if (filtering)
                                refilterLogEntries()
                            else
                                reloadLogs()
                        }

                        filteringOptionsContainer.appendChild(enableFilteringSwitch)
                    }


                    // Create the filter's inputbox
                    {
                        var domainsToHideInput = document.createElement("textarea")
                        domainsToHideInput.id = "domainsToHideInput"
                        domainsToHideInput.spellcheck = false
                        domainsToHideInput.value = NXsettings.LogsPage.DomainsToHide.join("\n")
                        domainsToHideInput.style = "width: 320px; height: 240px; min-width: 250px; min-height: 100px; border-radius: 15px; resize: both; padding-top: 5px;\
                                                    border: 1px groove lightgray; outline: 0px; padding-left: 10px; padding-right: 5px; overflow-wrap: normal;"

                        filteringOptionsContainer.appendChild(domainsToHideInput)
                    }


                    // Create the "Show number of entries" switch
                    {
                        const showNumEntriesSwitch = createSwitchCheckbox("Show number of entries")
                        showNumEntriesSwitch.firstChild.checked = NXsettings.LogsPage.ShowCounters
                        showNumEntriesSwitch.firstChild.onchange = function()
                        {
                            visibleEntriesCountEll.parentElement.style.visibility = this.checked ? "visible" : "hidden"
                            NXsettings.LogsPage.ShowCounters = this.checked
                            saveSettings()
                        }

                        filteringOptionsContainer.appendChild(showNumEntriesSwitch)
                    }

                    pageContentContainer.firstChild.insertBefore(filteringOptionsContainer, pageContentContainer.firstChild.firstChild)
                }



                function updateFilters()
                {
                    NXsettings.LogsPage.DomainsToHide = domainsToHideInput.value.split("\n").filter(d => d.trim() != "")        // Store each entry in an array, but don't include empty lines.
                    saveSettings()
                }
            }


            // Create the refresh button
            {
                const refreshButton = document.createElement("button")
                refreshButton.className = "btn btn-primary"
                refreshButton.style = "font-size: x-large; padding: 0px 2px; height: 25px; margin-right: 10px; margin-top: 3px;"
                refreshButton.onclick = function() { reloadLogs() }

                const icon = document.createElement("div")
                icon.style = "margin-top: -9px;"
                icon.innerHTML = "⟲"

                refreshButton.appendChild(icon)

                const inputContainer = logsContainer.firstChild.firstChild
                inputContainer.insertBefore(refreshButton, inputContainer.firstChild)
            }


            // Create the allow/deny popup
            {
                const elementsContainer = document.createElement("div")
                elementsContainer.onclick = function() { event.stopPropagation() }      // Prevent the popup from being hidden when clicking inside it
                elementsContainer.style = "background: #f7f7f7; position: absolute; right: 130px; height: max-content; width: max-content; \
                                           border: 2px solid lightgray; border-radius: 15px; z-index: 99; padding: 5px 15px 15px 15px; visibility: hidden;"

                const errorMsgSpan = document.createElement("span")
                errorMsgSpan.style = "display: block; min-height: 25px; line-height: 20px; margin-top: 0px;"
                errorMsgSpan.className = "ml-1 my-1 invalid-feedback"

                const input = document.createElement("input")
                input.style = "border-radius: 5px; width: 300px; padding: 5px;"
                input.className = "form-control mb-3"
                input.onkeyup = function()
                {
                    if (event.key == "Enter")  allowDenyPopup.fullDomainButton.click()
                    else if (event.key == "Escape")  allowDenyPopup.container.style.cssText += 'visibility: hidden;'
                }
                input.oninput = function()
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
                        createSpinner(allowDenyPopup.errorMsg)

                        // In NextDNS site, domains, TLDs, blocklists, and pretty much anything added by clicking an "Add" button, are added by sending these items' id with
                        // each character converted to hexadecimal, instead of plain text (ASCII). This converts the specified domain to hex then sends it to the respective list.
                        const requestString = allowDenyPopup.listName + "/hex:" + convertToHex(allowDenyPopup.input.value)

                        makeApiRequest("PUT", requestString, function(response)     // Make an asynchronous HTTP request and run this callback when finished.
                        {
                            if (response.includes(allowDenyPopup.input.value))          // After successfully adding the domain to the allow/denylist, NextDNS responds with the domain added and it's active status.
                            {                                                           // This checks if it was successful.
                                allowDenyPopup.errorMsg.textContent = '✔️'

                                // Auto dismiss the popup after 1 second
                                setTimeout(function() {
                                    allowDenyPopup.container.style.cssText += 'visibility: hidden; top: 0px'        // Top 0px, because otherwise it stays stuck with a top value greater than the body height when the log is reloaded.
                                    allowDenyPopup.errorMsg.innerHTML = ''
                                }, 750)

                                // Update the cached list of domains from the allow/denylist
                                makeApiRequest("GET", allowDenyPopup.listName, function(response) {
                                    allowDenyPopup.domainsList[allowDenyPopup.listName] = response
                                })
                            }
                            else if (response.includes("error"))                        // If it wasn't successful, get the error from the response and show the respective message above the popup's input box.
                            {
                                let error = JSON.parse(response).error

                                if (error.includes("exist"))
                                    error = "This domain has already been added"
                                else if (error.includes("invalid"))
                                    error = "Invalid domain"

                                allowDenyPopup.errorMsg.textContent = error
                                allowDenyPopup.errorMsg.classList.add("invalid-feedback")
                                allowDenyPopup.input.classList.add("is-invalid")
                            }

                        })

                    }
                    else
                    {
                        document.getElementById("domainsToHideInput").value += "\n" + allowDenyPopup.input.value
                        updateFilters()
                        allowDenyPopup.errorMsg.textContent = '✔️'
                        refilterLogEntries()

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
                    input.value = this.title.substring(this.title.indexOf("*") + 2)     // Instead of parsing the root domain again, get it from the title set by the Allow/Deny/Hide buttons.

                    if (allowDenyPopup.listName == "Hide")
                        input.value = "." + input.value     // Add a dot before the root domain to prevent false positives.

                    allowDenyPopup.fullDomainButton.click()
                }

                elementsContainer.appendChild(errorMsgSpan)
                elementsContainer.appendChild(input)
                elementsContainer.appendChild(fullDomainButton)
                elementsContainer.appendChild(rootDomainButton)

                logsContainer.parentElement.appendChild(elementsContainer)

                // Add all these elements in an object for easy access
                allowDenyPopup = {
                    parent: logsContainer.parentElement,
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


                // Cache the list of domains in the allowlist, then cache the list of domains in the denylist

                makeApiRequest("GET", "allowlist", function(response)
                {
                    allowDenyPopup.domainsList.allowlist = response;
                    makeApiRequest("GET", "denylist", function(response) { allowDenyPopup.domainsList.denylist = response })
                })

            }


            // Create the entries countings
            {
                if (!document.getElementById("visibleEntriesCount"))
                {
                    const countingsContainer = document.createElement("div")
                    countingsContainer.id = "counters"
                    countingsContainer.style = "text-align: right; border: solid 2px #aaa; border-radius: 10px; padding: 0px 10px 5px; width: 160px; background: white;"
                    countingsContainer.style.visibility = NXsettings.LogsPage.ShowCounters ? "visible" : "hidden"
                    countingsContainer.innerHTML = `
                        <b style="line-height: 35px;">Queries count</b>
                        Listed: <b id="visibleEntriesCount"></b><br>
                        Filtered: <b id="filteredEntriesCount"></b><br>
                        <span style="display: none;">All Hidden: <b id="allHiddenEntriesCount"></b><br></span>
                        Loaded: <b id="loadedEntriesCount"></b>
                    `
                    const hoverContainer = document.createElement("div")
                    hoverContainer.style = "position: fixed; bottom: 20px; right: 11.5%;"
                    hoverContainer.appendChild(countingsContainer)

                    document.body.appendChild(hoverContainer)

                    visibleEntriesCountEll   = document.getElementById("visibleEntriesCount")
                    filteredEntriesCountEll  = document.getElementById("filteredEntriesCount")   // Entries filtered by the domains filters.
                    allHiddenEntriesCountEll = document.getElementById("allHiddenEntriesCount")  // Entries from named devices.
                    loadedEntriesCountEll    = document.getElementById("loadedEntriesCount")     // All the entries of the loaded chunks.
                }
            }


            // Hide popups and dropdowns when the body is clicked

            document.body.onclick = function()
            {
                if (/\/logs/i.test(location.href))
                {
                    // Hide the allow/deny popup
                    allowDenyPopup.container.style.cssText += 'visibility: hidden; top: 0px'

                    // Hide the devices dropdown

                    const customDevicesDropdown = document.getElementById("customDevicesDropdown")

                    if (customDevicesDropdown != null && event.target != customDevicesDropdown.firstChild)
                        customDevicesDropdown.lastChild.classList.remove("show")

                    // Collapse the filtering options

                    const filtersButton = document.getElementById("filtersButton")

                    if (filtersButton && !filtersButton.className.includes("secondary"))
                        filtersButton.click()
                }
            }



            // Disable the original trigger that loads the next log chunk and add NXE's trigger

            addEventListener("scroll", function(e)
            {
                e.stopPropagation()     // Don't let the original event listener receive this event.

                if (!/\/logs/i.test(location.href))
                    return

                if (!cancelLoading && document.body.getBoundingClientRect().bottom < window.innerHeight * 3)        // Only load the next chunk if the user is three screens above the page bottom.
                    loadLogChunk({before: lastBefore})                                                              // This big distance makes scrolling the logs much more fluid, because when you
                                                                                                                    // reach the bottom, the next chunk is already loaded and you don't need to wait.
            }, true)


            // Make the search bar use NXE's code
            {
                const searchBarForm = logsContainer.querySelector("form")
                var searchBar = searchBarForm.firstChild.cloneNode(true)        // Take out the search bar from inside the form ...
                const container = searchBarForm.parentElement

                searchBarForm.remove()                                          // ... remove the form element ...
                container.appendChild(searchBar)                                // ... then add back the search bar. This is so that when hitting Enter, it doesn't reload the page.

                searchBar = container.lastChild

                searchBar.onkeyup = function(e)
                {
                    if (e.key == "Enter")
                    {
                        searchItems = this.value.split(" ")
                        searchString = searchItems.splice(0,1)     // Take only the first term to make the request. The other terms are used by NXE as filters for the results.
                        reloadLogs()
                    }
                    else clearSearchButton.style.display = this.value == "" ? "none" : "block"      // Hide the clear button when the input box is empty, and display it otherwise.
                }



                // Recreate the clear button for the search bar, as it's created and deleted in the original code, instead of just hidden
                {
                    var clearSearchButton = document.createElement("div")
                    clearSearchButton.innerHTML = "X"
                    clearSearchButton.style = "position: absolute; right: 10px; top: 8px; width: 15px; height: 15px; text-align: center; line-height: 13px; color: white; \
                                               border-radius: 15px; font-size: 10px; user-select: none; cursor: pointer; background: #bbb; font-weight: bold; display: none;"
                    clearSearchButton.onclick = function()
                    {
                        if (searchBar.value != "")
                        {
                            searchString = searchItems = searchBar.value = ""
                            this.style.display = "none"
                            reloadLogs()
                        }
                    }
                    searchBar.parentElement.appendChild(clearSearchButton)
                }
            }


            // Adapt the options button
            {
                const settingsButton = logsContainer.getByClass("settings-button")
                settingsButton.onclick = function()
                {
                    if (optionsContainer.style.display == "none")
                    {
                        optionsContainer.style.cssText += "display: flex !important;"
                        settingsButton.classList.add("active")
                    }
                    else
                    {
                        optionsContainer.style.cssText += "display: none !important;"
                        settingsButton.classList.remove("active")
                    }

                }

                const optionsContainer = document.createElement("div")
                optionsContainer.className = "d-md-flex mt-3"
                optionsContainer.style = "display: none !important; color: #777;"

                // Adapt the "Blocked Queries Only" switch
                {
                    optionsContainer.appendChild(createSwitchCheckbox("Blocked Queries Only"))
                    optionsContainer.firstChild.classList.add("mr-5")
                    optionsContainer.firstChild.lastChild.style.fontSize = "80%"
                    optionsContainer.firstChild.firstChild.onchange = function()
                    {
                        blockedQueriesOnly = +this.checked
                        loadBeforeGoButton.click()
                    }
                }

                // Adapt the "Raw DNS logs" switch
                {
                    optionsContainer.appendChild(createSwitchCheckbox("Raw DNS logs"))
                    optionsContainer.lastChild.lastChild.style.fontSize = "80%"
                    optionsContainer.lastChild.firstChild.onchange = function()
                    {
                        simpleLogs = +!this.checked
                        loadBeforeGoButton.click()
                    }
                }


                settingsButton.parentElement.parentElement.parentElement.appendChild(optionsContainer)
            }


            // Adapt the "Stream" button (real-time log)
            {
                const streamButton = logsContainer.getByClass("stream-button")
                streamButton.onclick = function()
                {
                    if (streamButton.classList.contains("streaming"))
                    {
                        streamButton.classList.remove("streaming")

                        clearInterval(realTimeLogsPolling)
                    }
                    else
                    {
                        streamButton.classList.add("streaming")

                        realTimeLogsPolling = setInterval(function()        // Poll for new log entries each 2 seconds.
                        {
                            if (!loadingChunk)
                                loadLogChunk({after: lastAfter})

                        }, 2000)
                    }
                }
            }


            // Remove leftover of the original logs container
            logsContainer.querySelector("div.text-center").remove()




            // And finally start loading the logs
            reloadLogs()



        }, 250)



        function openAllowDenyPopup(button)
        {
            const domainContainer = button.parentElement.parentElement.firstChild
            const fullDomain = domainContainer.secondChild().textContent
            let upperDomain =
            allowDenyPopup.input.value = fullDomain

            allowDenyPopup.errorMsg.classList.remove("invalid-feedback")
            allowDenyPopup.input.classList.remove("is-invalid")
            allowDenyPopup.errorMsg.innerHTML = ""

            if (button.innerText != "Hide")
            {
                allowDenyPopup.listName = button.innerText.toLowerCase() + "list"

                // Check if there's already an upper domain entry that includes the chosen subdomain

                while (upperDomain.indexOf(".") >= 0)                                       // As long as there's a dot...
                {
                    upperDomain = upperDomain.substring(upperDomain.indexOf(".") + 1)       // ... get the domain after the next dot.

                    if (allowDenyPopup.domainsList[allowDenyPopup.listName].includes('"' + upperDomain + '"'))      // If there's an entry which is included in this upper domain, set
                    {                                                                                               // a message to warn the user. Otherwise, check the next upper domain.
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

            allowDenyPopup.rootDomainButton.title = button.innerText + " any subdomain under *." + rootDomain


            // Set the button's label and color according to the action

            allowDenyPopup.fullDomainButton.className =
            allowDenyPopup.rootDomainButton.className = button.innerText == "Allow" ? "btn btn-success mt-1" : button.innerText == "Deny" ? "btn btn-danger mt-1" : "btn btn-secondary mt-1"

            allowDenyPopup.fullDomainButton.textContent = button.innerText + " domain"
            allowDenyPopup.rootDomainButton.textContent = button.innerText + " root"

            allowDenyPopup.container.style.cssText += "visibility: visible; top: " + (button.getBoundingClientRect().y - allowDenyPopup.parent.getBoundingClientRect().y - 170) + "px;"    // Show the popup right above the buttons.
            allowDenyPopup.input.focus()
            event.stopPropagation()     // Don't raise this event to the body, as the body hides the popup when clicked.
        }


        function loadLogChunk(params)
        {
            if (loadingChunk && !cancelLoading)     // Load only one chunk at a time.
                return
            else
                loadingChunk = true


            // Clear the logs
            {
                if (params.clear)
                {
                    existingEntries = logsContainer.querySelectorAll(".log")        // Here, the ideal would be using getElementsByClassName, but in WebExtension, for some reason, it just returns an array of empty objects.

                    for (let i = 0; i < existingEntries.length; i++)
                        existingEntries[i].remove()                                 // If clear is true, then remove all the loaded log entries to load again.

                    visibleEntriesCountEll.textContent = filteredEntriesCountEll.textContent = allHiddenEntriesCountEll.textContent = loadedEntriesCountEll.textContent = 0
                }
            }

            // Build the request string
            {
                logsRequestString = "logs?"

                buildLogsRequestString("device", currentDeviceId)       // The device id when loading the logs of specific devices.
                buildLogsRequestString("before", params.before)         // NextDNS' logs always responds to a GET with the 100 most recent log entries. The "before" parameter indicates to NextDNS that it should do so with the log entries that happened before the specified timestamp.
                buildLogsRequestString("after", params.after)           // The "after" parameter indicates to NextDNS that it should respond with the log entries that happened after the specified timestamp. Used by the stream button (real-time log).
                buildLogsRequestString("search", searchString)          // The search string. Used by the search bar.
                buildLogsRequestString("simple", simpleLogs)            // Used by the "Raw DNS logs" switch.
                buildLogsRequestString("blockedQueriesOnly", blockedQueriesOnly)    // Used by the "Blocked Queries Only" switch.
            }

            // Recreate the spinner when loading. It has a different color than the original to indicate that it's being loaded by NXE.
            {
                if (!params.after)     // Don't show the spinner when the real-time log is enabled.
                {
                    let spinner = logsContainer.getByClass("spinner-border")

                    if (spinner)  spinner.remove()

                    spinner = document.createElement("span")
                    spinner.className = "spinner-border text-primary my-4"
                    spinner.style = "height: 50px; width: 50px; align-self: center;"
                    logsContainer.appendChild(spinner)
                }
            }

            // Load the log entries data
            makeApiRequest("GET", logsRequestString, function(pResponse)
            {
                const response = JSON.parse(pResponse)
                const entriesData = response.logs

                if (entriesData.length > 0)
                {
                    lastBefore = entriesData.lastItem().timestamp       // Store the timestamp of the last entry, to load the older chunk starting from this timestamp. This timestamp is in Unix time.
                    lastAfter  = entriesData[0].timestamp               // Store the timestamp of the first entry, to load the newer chunk starting from this timestamp.

                    const now = new Date()          // Get the current date-time in Unix time.
                    const yesterday = (new Date(new Date().setDate(new Date().getDate() - 1))).getDate()

                    // Process the chunk's log entries
                    {
                        for (let i=0; i < entriesData.length; i++)
                        {
                            // Cancel old responses when reloading
                            {
                                if (cancelLoading)
                                {
                                    if (!params.clear)  // params.clear and cancelLoading are only true when the logs are being reloaded. So if cancelLoading is true
                                        return          // but params.clear is not, this means that this is the response of an old request and it should be canceled.
                                    else
                                        cancelLoading = false
                                }
                            }

                            loadedEntriesCountEll.textContent++     // textContent is the actual content of the element, while innerText or innerHTML is the content currently being displayed.


                            // Check if the entry matches any filter, and if so, remove it from the list
                            {
                                var domainName = entriesData[i].name
                                var isNamedDevice = !!entriesData[i].deviceName

                                if ((filtering && !domainName.includes("."))        // Chrome's random queries never have a dot.
                                    || (hideDevices && isNamedDevice)               // If enabled, named devices.
                                    || (filtering && NXsettings.LogsPage.DomainsToHide.some(d => domainName.includes(d)))    // If enabled, domains included in the list of domains to hide.
                                    || (searchItems && searchItems.some(i => i[0] == "-" ? domainName.includes(i.replace("-","")) : !domainName.includes(i))) )     // When there's more than one search term specified, if it's an exclusion, check whether the log entry contains the term, and
                                {                                                                                                                                   // if so, hide it, but if instead it's an inclusion, check whether the log entry does not contain the term, and if so, hide it.
                                    entriesData.splice(i,1)
                                    i--

                                    if (!hideDevices || hideDevices && !isNamedDevice)
                                        filteredEntriesCountEll.textContent++

                                    allHiddenEntriesCountEll.textContent++
                                    continue
                                }
                            }



                            // Otherwise, create all the entry's elements
                            {
                                const status = entriesData[i].status == 3 ? "whitelisted" : entriesData[i].status == 2 ? "blocked" : "default"

                                const entryContainer = document.createElement("div")
                                entryContainer.className = "log list-group-item"
                                entryContainer.style = "display: flex; justify-content: space-between; align-items: center; border-left: 4px solid;"
                                entryContainer.style.borderLeftColor = status == "whitelisted" ? "limegreen" : status == "blocked" ? "orangered" : "transparent"


                                // Create the elements of the left side of the log entry
                                {
                                    const leftSideContainer = document.createElement("div")

                                    // Create the domain's favicon element
                                    {
                                        const imgEll = document.createElement("img")
                                        imgEll.src = "https://favicons.nextdns.io/hex:" + convertToHex(domainName) + "@1x.png"  // NextDNS stores in their server every domain's favicon, and the image files are named after
                                        imgEll.className = "mr-2"                                                               // the domain's hex and the favicon's size, being 1x the smallest size and 3x the biggest.
                                        imgEll.style.marginTop = "-2px"
                                        imgEll.onerror = function()
                                        {
                                            // Gray globe icon. This happens when either NextDNS doesn't have the domain's favicon, then responding with a 404 "Not found" error, or the domain itself doesn't have a favicon at all.
                                            this.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAAxElEQVR42n3RO0vEYBCF4Sfb2iV/QBAW1s52izWQLoKsYMBAilg\
                                                        qfLBk/j9Y5L6FM9XwHuZyhjkKpV6S9EqFXRxUBqFTe/MrDCqHFTdCKwcPbkIIzSyphIsMnHxMOIRqnD1oJ/y0gSEMCkoxNef1ThBKet2y7KOzs6+NoCep9yc5\
                                                        LvhHIi1l0nkGLz5dndQS/d3U46ZXpx+X3OZ1wfm4ZGHYCZoJZ9rxzNGoMdfIXGajZqu3gly7tXp91rd3te7+Wf+++w9XTTyOUFyhzgAAAABJRU5ErkJggg=="
                                        }
                                        leftSideContainer.appendChild(imgEll)
                                    }

                                    // Create the domain name element
                                    {
                                        const domainEll = document.createElement("span")
                                        domainEll.className = "domainName"

                                        const innerHTML = "<span style='opacity: 0.6;'>" + domainName.substring(0, entriesData[i].rootDomainStartIndex) + "</span>"     // NextDNS stores at which character starts the root domain name,
                                                          + domainName.substring(entriesData[i].rootDomainStartIndex)                                                   // so everything before rootDomainStartIndex is a subdomain.

                                        const innerNode = (new DOMParser).parseFromString(innerHTML, "text/html").body      // It's required to parseFromString the HTML in order to pass AMO's code validation.

                                        domainEll.appendChild(innerNode.firstChild)
                                        domainEll.appendChild(innerNode.lastChild)

                                        leftSideContainer.appendChild(domainEll)
                                    }

                                    // Create the DNSSEC icon
                                    {
                                        if (entriesData[i].dnssec)
                                        {
                                            const DnsSecIconSrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAMCAYAAABbayygAAAAgklEQVQYlWP4jwSm7Lr736H10H+H1kP/fXqO/l998glcjgHGmLzrzn+H1kP/vXuO/s9\
                                                                   ffPG/d8/R/w6th/4fvvkGVSFM0efvv////////+0XX/47tB76n7/4IkLh+QcfUASRNTu0HiJR4fxDD+AC+DBD/uKLw0fh9osv/ucvvkgQAwBXBF9KK3QiTQAAAABJRU5ErkJggg=="

                                            const DnsSecContainer = createStylizedTooltipWithImgParent(DnsSecIconSrc, "Validated with DNSSEC")
                                            DnsSecContainer.style.marginLeft = "10px"

                                            leftSideContainer.appendChild(DnsSecContainer)
                                        }
                                    }

                                    // Create the query type element
                                    {
                                        if (entriesData[i].type)
                                        {
                                            const queryTypeEll = document.createElement("span")
                                            queryTypeEll.style = "font-weight: 600; font-size: 10px; opacity: 0.4; margin-left: 10px; background: #eee; padding: 1px 4px;"
                                            queryTypeEll.innerText = entriesData[i].type

                                            leftSideContainer.appendChild(queryTypeEll)
                                        }
                                    }

                                    // Create the block/allow reason icon and tooltip
                                    {
                                        if (status != "default")
                                        {
                                            const blockReasonIcon = document.createElement("div")
                                            blockReasonIcon.innerHTML = "i"
                                            blockReasonIcon.style = "display: inline-block; border-radius: 12px; width: 13px; height: 13px; text-align: center; color: white; \
                                                                     font-weight: bold; font-family: serif; font-size: 11px; user-select: none; line-height: 13px; margin-left: 10px;"
                                            blockReasonIcon.style.background = entryContainer.style.borderLeftColor

                                            // matchedName is the CNAME that got blocked. lists is an array containing the name of each list that includes this domain
                                            const blockReasonText = (entriesData[i].matchedName ? "<b style='font-size: 13px; display: block; margin: 5px 3px 8px 3px;'>→ " + entriesData[i].matchedName + "</b>": "")
                                                                  + (status == "whitelisted" ? "Allowed" : "Blocked") + " by " + entriesData[i].lists.join(", ")
                                            blockReasonIcon.createStylizedTooltip(blockReasonText)

                                            leftSideContainer.appendChild(blockReasonIcon)
                                        }
                                    }

                                    entryContainer.appendChild(leftSideContainer)

                                }


                                // Create the Hide/Allow/Deny buttons
                                {
                                    const buttonsContainer = document.createElement("div")
                                    buttonsContainer.style = "visibility: hidden; margin-right: 25px; margin-left: auto;"

                                    const hideButton = document.createElement("button")
                                    hideButton.className = "btn btn-secondary mr-4"
                                    hideButton.innerHTML = "Hide"
                                    hideButton.onclick = function() { openAllowDenyPopup(hideButton) }

                                    buttonsContainer.appendChild(hideButton)

                                    if (status == "default")
                                    {
                                        const denyButton = document.createElement("button")
                                        denyButton.className = "btn btn-danger mr-4"
                                        denyButton.innerHTML = "Deny"
                                        denyButton.onclick = function() { openAllowDenyPopup(denyButton) }

                                        buttonsContainer.appendChild(denyButton)
                                    }

                                    if (status != "whitelisted")
                                    {
                                        const allowButton = document.createElement("button")
                                        allowButton.className = "btn btn-success"
                                        allowButton.innerHTML = "Allow"
                                        allowButton.onclick = function() { openAllowDenyPopup(allowButton) }

                                        buttonsContainer.appendChild(allowButton)
                                    }

                                    entryContainer.appendChild(buttonsContainer)
                                }


                                // Create the elements of the right side of the log entry
                                {
                                    const rightSideContainer = document.createElement("div")
                                    rightSideContainer.style = "font-size: 0.9em; display: grid;"

                                    // Create the device name row
                                    {
                                        const deviceContainer = document.createElement("div")
                                        deviceContainer.style = "height: 15px; margin-bottom: 10px; margin-left: auto;"

                                        const deviceNameEll = document.createElement("span")
                                        deviceNameEll.textContent = entriesData[i].deviceName

                                        deviceContainer.appendChild(deviceNameEll)

                                        if (!isNamedDevice)                     // If the query was made from an unnamed device ...
                                        {
                                            if (!entriesData[i].clientIp)       // ... and the log IP is disabled, then show the gray empty space.
                                            {
                                                deviceContainer.innerHTML = "&nbsp;"
                                                deviceContainer.style.cssText += "background-color: #eee; width: 90px; margin-bottom: 5px; margin-top: 5px;"
                                            }
                                            else                                // But if the log IP is enabled, then show the IP.
                                                deviceContainer.textContent = entriesData[i].clientIp
                                        }
                                        else if (entriesData[i].clientIp)       // Otherwise, if it's from a named device and the IP is enabled, then show the device name and add a tooltip with the IP.
                                        {
                                            deviceNameEll.createStylizedTooltip(entriesData[i].clientIp)
                                            deviceNameEll.lastChild.style.fontSize = "14px"
                                        }


                                        if (entriesData[i].isEncryptedDNS)
                                        {
                                            // Create the DoH/DoT padlock icon

                                            const encryptedQueryIconSrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAALCAYAAABGbhwYAAAAdUlEQVQYlcXPIQ7EMBADwLzWeP8QuqGm+UNC09csDQ51ybVqTjqp7CyZW\
                                                                           COtNumTtZaO4xBJ9d4159Qz6UI5ZwG4a2aKiB221gRAtVZFhMYYAiCSO3R3AdhOfW/vIUmZmQColHL32kgqIpSeD/wqyXfQ3f8JT3fXMJ8Ei4pHAAAAAElFTkSuQmCC"

                                            const encryptedQueryContainer = createStylizedTooltipWithImgParent(encryptedQueryIconSrc, entriesData[i].protocol)
                                            encryptedQueryContainer.lastChild.style.fontSize = "0.9em"

                                            if (isNamedDevice || entriesData[i].clientIp)
                                                encryptedQueryContainer.style.marginRight = "5px"
                                            else
                                            {
                                                encryptedQueryContainer.style.marginLeft = "-15px"
                                                encryptedQueryContainer.firstChild.style.marginTop = "-4px"
                                            }


                                            deviceContainer.insertBefore(encryptedQueryContainer, deviceContainer.firstChild)
                                        }

                                        rightSideContainer.appendChild(deviceContainer)
                                    }

                                    // Create the date-time element
                                    {
                                        const dateTimeEll = document.createElement("span")
                                        dateTimeEll.style = "font-size: 0.8em; color: #bbb; min-width: 250px; text-align: end;"
                                        dateTimeEll.setAttribute("time", entriesData[i].timestamp)
                                        processTimestamp(entriesData[i].timestamp, now, yesterday, dateTimeEll)

                                        rightSideContainer.appendChild(dateTimeEll)
                                    }

                                    entryContainer.appendChild(rightSideContainer)
                                }

                                if (params.after)
                                    logsContainer.insertBefore(entryContainer, logsContainer.children[i+1])
                                else
                                    logsContainer.appendChild(entryContainer)
                            }


                            visibleEntriesCountEll.textContent++


                        }
                    }
                }

                if (entriesData.length == 0)        // If NextDNS responds with an empty list or all entries were filtered, then show the "No logs yet" message.
                {
                    if (!document.getElementById("noLogsSpan") && document.getElementsByClassName("log").length == 0)
                    {
                        const noLogsSpan = document.createElement("span")
                        noLogsSpan.id = "noLogsSpan"
                        noLogsSpan.innerHTML = "No logs yet."
                        noLogsSpan.style = "text-align: center; margin: 20px; color: #aaa;"
                        logsContainer.appendChild(noLogsSpan)
                    }

                    cancelLoading = false
                }
                else
                {
                    // Remove the "No logs" message
                    const noLogsSpan = document.getElementById("noLogsSpan")
                    if (noLogsSpan)  noLogsSpan.remove()
                }

                // Now that all entries were processed, the spinner can be removed.
                const spinner = logsContainer.getByClass("spinner-border")
                if (spinner)  spinner.remove()

                loadingChunk = false

                if (!response.hasMore && !params.after)      // For every chunk, NextDNS sets a property called hasMore, which indicates whether there are more log entries to load.
                    cancelLoading = true

                if (!cancelLoading && entriesData.length < 25 && document.body.getBoundingClientRect().bottom < window.innerHeight * 5 && !params.after)     // Automatically load the next chunk when less than 25 entries of the chunk are listed.
                {
                    loadLogChunk({before: lastBefore})

                    if (entriesData.length < 7 && document.body.getBoundingClientRect().bottom < window.innerHeight + 400)      // 400 is the vertical space taken by 6 entries.
                        scrollTo(0, document.body.scrollHeight)     // Automatically scroll to bottom when less than 7 entries of the chunk are listed.
                }


            })
        }

        function reloadLogs(params)
        {
            if (!params)  params = {}

            params.clear = true

            cancelLoading = true
            loadLogChunk(params)

            if (typeof updateRelativeTimeInterval != "undefined")
                clearInterval(updateRelativeTimeInterval)

            // Set an interval that updates the relative time of the log entries every 20 seconds.
            updateRelativeTimeInterval = setInterval(function()
            {
                const now = new Date()
                const yesterday = (new Date(new Date().setDate(new Date().getDate() - 1))).getDate()
                const logEntries = logsContainer.querySelectorAll(".relativeTime")

                for (let i=0; i < logEntries.length; i++)
                    processTimestamp(+logEntries[i].getAttribute("time"), now, yesterday, logEntries[i])

            }, 20000)
        }

        function refilterLogEntries()
        {
            const entries = logsContainer.querySelectorAll(".log")

            allHiddenEntriesCountEll.textContent -= filteredEntriesCountEll.textContent
            visibleEntriesCountEll.textContent = 0

            for (let i=0; i < entries.length; i++)
            {
                const domainName = entries[i].getByClass("domainName").textContent

                if (!domainName.includes(".")   // Chrome's random queries
                    || NXsettings.LogsPage.DomainsToHide.some(d => domainName.includes(d)) )   // Domains included in the list of domains to hide.
                {
                    entries[i].remove()
                    filteredEntriesCountEll.textContent++
                    allHiddenEntriesCountEll.textContent++
                }
                else visibleEntriesCountEll.textContent++
            }
        }

        function processTimestamp(timestamp, now, yesterday, dateTimeElement)
        {
            const relativeSecs = (now.getTime() - timestamp) / 1000       // Get the relative time in seconds.
            relativeMinutes = relativeSecs/60
            relativeHours = relativeMinutes/60
            timestampDateObj = new Date(timestamp)
            timestampHours = timestampDateObj.getHours()

            fullDateTime = dateTimeFormatter.format(timestampDateObj)

            today = now.getDate()
            timestampDay = timestampDateObj.getDate()


            if (relativeHours > 48 || timestampDay != today && timestampDay != yesterday)                             // If older than 2 days, show the full date-time.
            {
                dateTimeElement.textContent = fullDateTime.replace(/(202\d) /, "$1, ")     // Add a comma after the year if there isn't one.
                dateTimeElement.classList.remove("relativeTime")
            }
            else        // Otherwise, show the relative time
            {
                dateTimeElement.className = "relativeTime"

                if (relativeSecs < 10)
                    dateTimeElement.textContent = "a few seconds ago"
                else if (relativeSecs < 60)
                    dateTimeElement.textContent = "some seconds ago"
                else if (relativeSecs < 120)
                    dateTimeElement.textContent = "a minute ago"
                else
                {
                    currentHour = now.getHours()

                    if (relativeMinutes < 60)
                        dateTimeElement.textContent = parseInt(relativeMinutes) + " minutes ago"
                    else if (parseInt(relativeHours) == 1)
                        dateTimeElement.textContent = "1 hour ago"
                    else if (relativeHours < 24)
                        dateTimeElement.textContent = parseInt(relativeHours) + " hours ago"

                    if (timestampDay == yesterday)
                        dateTimeElement.textContent = "Yesterday, " + dateTimeElement.textContent
                }

                dateTimeElement.textContent += String.fromCharCode(160) + " (" + timestampDateObj.toLocaleTimeString() + ")"     // Char code 160 is the &nbsp; character.
            }
        }

        function buildLogsRequestString(paramName, paramValue)
        {
            if (paramValue)
            {
                if (logsRequestString.includes("="))
                    logsRequestString += "&"

                logsRequestString += paramName + "=" + paramValue
            }
        }



    // --------------------------- Privacy page ---------------------------


    }
    else if (/privacy$/.test(location.href))
    {
        const waitForLists = setInterval(function()
        {
            if (document.querySelector(".list-group-item") != null)
            {
                clearInterval(waitForLists)

                // Hide list of blocklists and create the Show button and the collapse switch
                hideAllListItemsAndCreateButton("Show added lists", NXsettings.PrivacyPage)


                // Sort blocklists alphabetically in the modal

                document.querySelector(".card-footer button").onclick = function()
                {
                    const waitForListsModal = setInterval(function()
                    {
                        if (document.querySelector(".modal-body .list-group-item") != null)
                        {
                            clearInterval(waitForListsModal)

                            const sortAZSwitch = createSwitchCheckbox("Sort A-Z")
                            sortAZSwitch.style = "position: absolute; right: 100px; bottom: 15px;"
                            sortAZSwitch.firstChild.checked = NXsettings.PrivacyPage.SortAZ
                            sortAZSwitch.firstChild.onchange = function()
                            {
                                sortItemsAZ(".modal-body .list-group")
                                NXsettings.PrivacyPage.SortAZ = this.checked
                                saveSettings()
                            }

                            const container = document.querySelector(".modal-header")
                            container.style.position = "relative"
                            container.appendChild(sortAZSwitch)

                            if (NXsettings.PrivacyPage.SortAZ)
                                sortItemsAZ(".modal-body .list-group")

                        }
                    }, 100)

                }
            }
        }, 500)



    // --------------------------- Security page ---------------------------


    }
    else if (/security$/.test(location.href))
    {
        const waitForLists = setInterval(function()
        {
            if (document.querySelector(".list-group-item") != null)
            {
                clearInterval(waitForLists)

                // Hide list of TLDs and create the Show button and the collapse switch
                hideAllListItemsAndCreateButton("Show added TLDs", NXsettings.SecurityPage)

                // Create the "Add all TLDs" button in the modal

                document.querySelector(".card-footer button").onclick = function()
                {
                    const waitForListsModal = setInterval(function()
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
                                const modal = document.getByClass("modal-body")
                                const numTLDsToBeAdded = modal.getElementsByClassName("btn-primary").length

                                if (numTLDsToBeAdded > 0)
                                {
                                    if (confirm("This will add all TLDs to the block list. Are you sure?"))
                                    {
                                        createPleaseWaitModal("Adding all TLDs")

                                        // Process the TLDs

                                        const buttons = modal.getElementsByClassName("btn")     // Here a getElementsByClassName is required instead of a querySelectorAll, as the former returns a list of
                                        const buttonsClicked = []                               // references, while the latter returns a list of static copies that are applied to the original when set.
                                        let numTLDsAdded = 0

                                        const checkIfFinished = function()
                                        {
                                            if (numTLDsAdded == numTLDsToBeAdded)
                                            {
                                                setInterval(function()
                                                {
                                                    for (let j=0; j < buttonsClicked.length; j++)
                                                    {                                                                           // If the "Add" button changed to the "Remove" button, this means that the TLD was successfully added.
                                                        if (buttons[buttonsClicked[j]].classList.contains("btn-danger"))        // It wouldn't be possible to get an updated classList if querySelectorAll was used.
                                                            buttonsClicked.splice(j,1)
                                                    }

                                                    if (buttonsClicked.length == 0)
                                                        location.reload()

                                                }, 500)
                                            }
                                        }

                                        for (let i=0; i < buttons.length; i++)
                                        {
                                            const TLD = buttons[i].parentElement.previousSibling.textContent.replace(".","")

                                            if (buttons[i].classList.contains("btn-primary"))
                                            {
                                                if (!/[^\w]/.test(TLD))             // If there isn't a character in the TLD which is not a-z, then make the request normally.
                                                {
                                                    makeApiRequest("PUT", "security/blocked_tlds/hex:" + convertToHex(TLD), function() { numTLDsAdded++; checkIfFinished() })
                                                }
                                                else                                // Otherwise, click on the button instead. This is because the hexed string in NextDNS for non-english characters comes from punycode (xn--abcde),
                                                {                                   // instead of from simple Unicode (\uhex), and I couldn't find any easy way of doing this conversion without using external libraries.
                                                    setTimeout(function(i)
                                                    {
                                                        buttons[i].click();
                                                        buttonsClicked.push(i)      // Store in an array the index of all buttons that were clicked, then check whether they finished adding.
                                                        numTLDsAdded++

                                                        checkIfFinished()

                                                    }, 500, i)
                                                }
                                            }
                                        }
                                    }
                                }
                                else alert("All TLDs are already added.")
                            }

                            const header = document.querySelector(".modal-header")
                            header.style = "position: relative;"
                            header.appendChild(addAll)

                        }
                    }, 500)
                }
            }
        }, 500)



    // ---------------------- Allowlist/Denylist page -------------------------


    }
    else if (/allowlist$|denylist$/.test(location.href))
    {
        const waitForDomains = setInterval(function()
        {
            if (document.querySelectorAll(".list-group-item").length > 1)                       // It's required to wait for at least one domain to load before adding the features, otherwise the appends fail on slower connections.
            {
                clearInterval(waitForDomains)

                // Create the options menu

                if (!document.getElementById("allowDenylistOptions"))
                {
                    const optionsContainer = document.createElement("div")
                    optionsContainer.style = "border: 1px solid lightgray; border-radius: 15px; padding: 5px 15px 5px 0px; float: right; margin-right: 10px; display: none;"


                    const optionsButton = document.createElement("button")
                    optionsButton.id = "allowDenylistOptions"
                    optionsButton.className = "btn btn-clear"
                    optionsButton.style = "width: 30px; padding: 1px 0px 3px 3px; border: 1px solid lightgray; float: right;"
                    optionsButton.innerHTML = "⚙️"
                    optionsButton.onclick = function()
                    {
                        optionsContainer.style.display = optionsContainer.style.display == "none" ? "initial" : "none"
                        this.blur()
                    }


                    const sortAZSwitch = createSwitchCheckbox("Sort A-Z")
                    sortAZSwitch.firstChild.checked = NXsettings.AllowDenylistPage.SortAZ
                    sortAZSwitch.onchange = function()
                    {
                        sortItemsAZ(".list-group:nth-child(2)", "domain", sortTLDSwitch.firstChild)
                        NXsettings.AllowDenylistPage.SortAZ = this.firstChild.checked
                        saveSettings()
                    }

                    optionsContainer.appendChild(sortAZSwitch)

                    const sortTLDSwitch = createSwitchCheckbox("Sort by TLD")
                    sortTLDSwitch.firstChild.checked = NXsettings.AllowDenylistPage.SortTLD
                    sortTLDSwitch.onchange = function()
                    {
                        sortItemsAZ(".list-group:nth-child(2)", "domain", this.firstChild)
                        NXsettings.AllowDenylistPage.SortTLD = this.firstChild.checked
                        saveSettings()
                    }

                    optionsContainer.appendChild(sortTLDSwitch)

                    const boldRootSwitch = createSwitchCheckbox("Bold root domain")
                    boldRootSwitch.firstChild.checked = NXsettings.AllowDenylistPage.Bold
                    boldRootSwitch.onchange = function()
                    {
                        styleDomains("bold", this.firstChild.checked)
                        NXsettings.AllowDenylistPage.Bold = this.firstChild.checked
                        saveSettings()
                    }

                    optionsContainer.appendChild(boldRootSwitch)

                    const lightenSwitch = createSwitchCheckbox("Lighten subdomains")
                    lightenSwitch.firstChild.checked = NXsettings.AllowDenylistPage.Lighten
                    lightenSwitch.onchange = function()
                    {
                        styleDomains("lighten", this.firstChild.checked)
                        NXsettings.AllowDenylistPage.Lighten = this.firstChild.checked
                        saveSettings()
                    }

                    optionsContainer.appendChild(lightenSwitch)

                    const rightAlignSwitch = createSwitchCheckbox("Right-aligned")
                    rightAlignSwitch.firstChild.checked = NXsettings.AllowDenylistPage.RightAligned
                    rightAlignSwitch.onchange = function()
                    {
                        NXsettings.AllowDenylistPage.RightAligned = this.firstChild.checked
                        styleDomains("rightAlign", this.firstChild.checked)
                        saveSettings()
                    }

                    optionsContainer.appendChild(rightAlignSwitch)

                    const multiLineSwitch = createSwitchCheckbox("Add a list of domains")
                    multiLineSwitch.firstChild.checked = NXsettings.AllowDenylistPage.MultilineTextBox
                    multiLineSwitch.onchange = function()
                    {
                        NXsettings.AllowDenylistPage.MultilineTextBox = this.firstChild.checked
                        saveSettings()

                        if (this.firstChild.checked)
                            createAllowDenylistTextArea()
                    }

                    optionsContainer.appendChild(multiLineSwitch)


                    const rectangleAboveInput = document.querySelector(".list-group").firstChild
                    rectangleAboveInput.insertBefore(optionsButton, rectangleAboveInput.firstChild)
                    rectangleAboveInput.appendChild(optionsContainer)
                    rectangleAboveInput.onclick = () => event.stopPropagation()

                    document.body.onclick = () => optionsContainer.style.display = "none"
                }


                // Create the input box for the domain descriptions
                {
                    const domainsItems = document.querySelectorAll(".list-group-item")

                    const saveDescription = function(input)
                    {
                        NXsettings.AllowDenylistPage.DomainsDescriptions[input.previousSibling.textContent.substring(2)] = input.value
                        saveSettings()
                    }

                    for (let i=1; i < domainsItems.length; i++)
                    {
                        const descriptionInput = document.createElement("input")
                        descriptionInput.className = "description form-control"
                        descriptionInput.placeholder = "Add a description. Press Enter to save."
                        descriptionInput.style = "border: 0; background: transparent; color: gray; width: 100%; height: 27px; padding-left: 10px; padding-top: 3px; margin-top: 3px; margin-bottom: -5px;"
                        descriptionInput.onkeypress = function(event)
                        {
                            if (event.key == "Enter")
                            {
                                saveDescription(this)
                                this.blur()
                            }
                        }
                        descriptionInput.onblur  = function()
                        {
                            descriptionInput.style.display = descriptionInput.value != "" ? "initial" : "none"
                            saveDescription(descriptionInput)
                        }

                        descriptionInput.value = NXsettings.AllowDenylistPage.DomainsDescriptions[domainsItems[i].textContent.substring(2)] || ""

                        if (descriptionInput.value == "")
                            descriptionInput.style.display = "none"

                        domainsItems[i].firstChild.firstChild.appendChild(descriptionInput)

                        descriptionInput.parentElement.style.cssText += "display: grid !important;"
                    }
                }


                // Apply the options

                if (NXsettings.AllowDenylistPage.SortAZ)
                    sortItemsAZ(".list-group:nth-child(2)", "domain", NXsettings.AllowDenylistPage.SortTLD)

                styleDomains("bold", NXsettings.AllowDenylistPage.Bold)
                styleDomains("lighten", NXsettings.AllowDenylistPage.Lighten)

                if (NXsettings.AllowDenylistPage.RightAligned)
                    styleDomains("rightAlign", NXsettings.AllowDenylistPage.RightAligned)

                if (NXsettings.AllowDenylistPage.MultilineTextBox)
                    createAllowDenylistTextArea()




                function createAllowDenylistTextArea()
                {
                    // Make the input box allow adding a list of domains

                    const input = document.querySelector("form input")

                    if (!input)  return

                    const inputHtml = input.outerHTML.replace("<input ", "<textarea ")                          // Swap the input to a textarea to make it multi-line.
                    const container = input.parentElement.parentElement.parentElement
                    container.firstChild.remove()                                                               // Replace with the textarea, the form that contains the input.

                    let textArea = (new DOMParser).parseFromString(inputHtml, "text/html").body.firstChild      // It's required to parseFromString the HTML in order to pass AMO's code validation.
                    container.appendChild(textArea)

                    textArea = container.firstChild
                    textArea.style = "height: 63px; background-position-x: calc(100% - 20px); min-height: 38px;"
                    textArea.placeholder = "Add one or more domains, one per line. Press Enter to submit."
                    textArea.onkeypress = function()
                    {
                        this.classList.remove("is-invalid")
                        this.nextSibling.textContent = ""

                        if (event.key == "Enter" && !event.shiftKey)                                            // Allow shift+ctrl to break line.
                        {
                            event.preventDefault()

                            const list = (/allowlist$/.test(location.href)) ? "allowlist" : "denylist"
                            const domains = this.value.split("\n").filter(d => d.trim() != "")                  // Ignore empty lines.
                            let numFinishedRequests = numImportedDomains = 0

                            if (domains.length > 500)
                            {
                                this.classList.add("is-invalid")
                                this.nextSibling.textContent = "To prevent server issues, you cannot import a list with more than 500 domains."
                                this.nextSibling.className = "invalid-feedback"

                                return
                            }

                            if (domains.length == 0)
                                return


                            createSpinner(this.parentElement)

                            for (let i=0; i < domains.length; i++)
                            {
                                const domain = domains[i].trim()

                                makeApiRequest("PUT", list + "/hex:" + convertToHex(domain), function(response)
                                {
                                    numFinishedRequests++

                                    if (!response.includes("error"))
                                        numImportedDomains++
                                    else
                                    {
                                        let error = JSON.parse(response).error

                                        if (error.includes("exist"))
                                            error = "This domain has already been added: " + domain
                                        else if (error.includes("invalid"))
                                            error = "Invalid domain: " + domain

                                        textArea.classList.add("is-invalid")
                                        textArea.nextSibling.textContent = error
                                        textArea.nextSibling.className = "invalid-feedback"

                                    }

                                    if (numFinishedRequests == domains.length)
                                    {
                                        if (numImportedDomains > 0)
                                        {
                                            textArea.parentElement.lastChild.outerHTML = '✔️'
                                            setTimeout(() => location.reload(), 500)
                                        }
                                        else textArea.parentElement.lastChild.outerHTML = ""
                                    }

                                })
                            }

                        }
                    }

                    const errorMsgSpan = document.createElement("span")
                    errorMsgSpan.className = "invalid-feedback"
                    container.appendChild(errorMsgSpan)
                }

            }

        }, 500)



    // --------------------------- Settings page ---------------------------


    }
    else if (/settings$/.test(location.href))
    {
        const waitForContent = setInterval(function()
        {
            if (document.querySelector(".card-body") != null)
            {
                clearInterval(waitForContent)

                const exportNXButton = document.createElement("button")
                exportNXButton.className = "btn btn-light"
                exportNXButton.innerHTML = "Export NXE settings"
                exportNXButton.onclick = function()
                {
                    exportToFile(NXsettings, "NXE-Settings.json")
                }

                const importNXButton = document.createElement("button")
                importNXButton.className = "btn btn-light"
                importNXButton.innerHTML = "Import NXE settings"
                importNXButton.onclick = function() { this.nextSibling.click() }      // Click the file input button.

                const fileNXInput = document.createElement("input")
                fileNXInput.type = "file"
                fileNXInput.style = "display: none;"
                fileNXInput.onchange = function()
                {
                    const file = new FileReader()
                    file.onload = function()
                    {
                        NXsettings = JSON.parse(this.result)
                        saveSettings()
                        importNXButton.textContent += " ✔️"

                        setTimeout(()=> { importNXButton.textContent = importNXButton.textContent.replace("✔️","") }, 2000)
                    }

                    file.readAsText(this.files[0])
                }


                const exportConfigButton = document.createElement("button")
                exportConfigButton.className = "btn btn-primary"
                exportConfigButton.innerHTML = "Export this config"
                exportConfigButton.onclick = function()
                {
                    const config = {}
                    const pages = ["security", "privacy", "parentalcontrol", "denylist", "allowlist", "settings"]
                    let numPagesExported = 0

                    createSpinner(this) // Add a spinning circle beside the button to indicate that something is happening


                    for (let i=0; i < pages.length; i++)
                    {
                        makeApiRequest("GET", pages[i], function(response)  // Get the settings from each page
                        {
                            config[pages[i]] = JSON.parse(response)
                            numPagesExported++

                            if (numPagesExported == pages.length)
                            {
                                // Export only the relevant data from these settings

                                config.privacy.blocklists = config.privacy.blocklists.map(b => b.id)
                                config.settings.rewrites = config.settings.rewrites.map((r) => {return {name: r.name, answer: r.answer}})
                                config.parentalcontrol.services = config.parentalcontrol.services.map((s) => {return {id: s.id, active: s.active}})

                                const fileName = location.href.split("/")[3] + "-Export.json"       // <Current config ID>-Export.json

                                exportToFile(config, fileName)

                                exportConfigButton.lastChild.remove() // Remove the spinner when done
                            }
                        })
                    }

                }

                const importConfigButton = document.createElement("button")
                importConfigButton.className = "btn btn-primary"
                importConfigButton.innerHTML = "Import a config"
                importConfigButton.onclick = function() { this.nextSibling.click() }      // Click the file input button.

                const fileConfigInput = document.createElement("input")
                fileConfigInput.type = "file"
                fileConfigInput.style = "display: none;"
                fileConfigInput.onchange = function()
                {
                    const file = new FileReader()
                    file.onload = function()
                    {
                        const config = JSON.parse(this.result)
                        delete config.settings.name             // Don't import the config name.

                        let importTLDs = true                               // Most likely the server has a DOS attack prevention system, and this makes the API reject every PATCH request when a certain limit
                                                                            // of connections is reached. Because every added TLD is a new connection, cutting down the number of TLDs solves the problem. But if the
                        if (config.security.blocked_tlds.length > 500)      // user added more than 500 TLDs, then most likely almost every TLD was added, so it's better to just use the "Add all TLDs" button for that.
                        {
                            alert("WARNING: It seems that you are attempting to import a configuration file that contains a very long list of TLDs. \n"+
                                  "Importing long lists overwhelms the server and it starts rejecting connections. \n"+
                                  "Because of that, all settings will be imported, except the TLDs. \n"+
                                  "If you want to import the TLDs, go to the Security page and use the \"Add all TLDs\" button, then remove the TLDs that you want to allow.")

                            importTLDs = false
                        }

                        const numItemsImported = {
                            security: false,
                            blocked_tlds: 0,
                            privacy: false,
                            blocklists: 0,
                            natives: 0,
                            parentalcontrol: false,
                            "parentalcontrol/services": 0,
                            "parentalcontrol/categories": 0,
                            denylist: 0,
                            allowlist: 0,
                            settings: false,
                            rewrites: 0
                        }

                        const importAllAndSwitchDisabledItems = function(listName, idPropName)
                        {
                            let listObj = config[listName]

                            if (listName.includes("/"))
                            {
                                const listSplit = listName.split("/")
                                listObj = config[listSplit[0]]
                                if (listSplit.length == 2)
                                    listObj = listObj[listSplit[1]]
                            }

                            for (let i=0; i < listObj.length; i++)
                            {
                                const item = listObj[i]
                                const hexedId = convertToHex(item[idPropName])

                                makeApiRequest("PUT", listName + "/hex:" + hexedId, function(response)
                                {
                                    numItemsImported[listName]++
                                    if (numItemsImported[listName] == listObj.length)
                                    {
                                        const disabledItems = listObj.filter(d => !d.active).map(d => convertToHex(d[idPropName]))  // Store in an array the hex of each disabled item id

                                        for (let i=0; i < disabledItems.length; i++)
                                            makeApiRequest("PATCH", listName+"/hex:" + disabledItems[i], false, {"active":false})
                                    }
                                })
                            }
                        }


                        // Import Security page

                        makeApiRequest("PATCH", "security", ()=> numItemsImported.security = true, config.security)

                        if (importTLDs)
                        {
                            for (let i=0; i < config.security.blocked_tlds.length; i++)     // NextDNS doesn't accept multiple TLDs or domains in one go, so every entry need to be added one by one.
                                makeApiRequest("PUT", "security/blocked_tlds/hex:" + convertToHex(config.security.blocked_tlds[i]), ()=> numItemsImported.blocked_tlds++)
                        }


                        // Import Privacy page

                        makeApiRequest("PATCH", "privacy", ()=> numItemsImported.privacy = true, config.privacy)

                        for (let i=0; i < config.privacy.blocklists.length; i++)
                            makeApiRequest("PUT", "privacy/blocklists/hex:" + convertToHex(config.privacy.blocklists[i]), ()=> numItemsImported.blocklists++)

                        for (let i=0; i < config.privacy.natives.length; i++)
                            makeApiRequest("PUT", "privacy/natives/hex:" + convertToHex(config.privacy.natives[i].id), ()=> numItemsImported.natives++)


                        // Import Parental Control page

                        makeApiRequest("PATCH", "parentalcontrol", ()=> numItemsImported.parentalcontrol = true, config.parentalcontrol)

                        importAllAndSwitchDisabledItems("parentalcontrol/services", "id")
                        importAllAndSwitchDisabledItems("parentalcontrol/categories", "id")


                        // Import Allow/Denylists

                        importAllAndSwitchDisabledItems("denylist", "domain")
                        importAllAndSwitchDisabledItems("allowlist", "domain")


                        // Import Settings page

                        makeApiRequest("PATCH", "settings", ()=> numItemsImported.settings = true, config.settings)

                        for (let i=0; i < config.settings.rewrites.length; i++)
                            makeApiRequest("POST", "settings/rewrites", ()=> numItemsImported.rewrites++, config.settings.rewrites[i])


                        // Check if all settings finished importing

                        setInterval(function()
                        {
                            if (numItemsImported.security
                             && (!importTLDs || config.security.blocked_tlds.length == numItemsImported.blocked_tlds)
                             && numItemsImported.privacy
                             && config.privacy.blocklists.length == numItemsImported.blocklists
                             && config.privacy.natives.length == numItemsImported.natives
                             && numItemsImported.parentalcontrol
                             && config.parentalcontrol.services.length == numItemsImported["parentalcontrol/services"]
                             && config.parentalcontrol.categories.length == numItemsImported["parentalcontrol/categories"]
                             && config.denylist.length == numItemsImported.denylist
                             && config.allowlist.length == numItemsImported.allowlist
                             && numItemsImported.settings
                             && config.settings.rewrites.length == numItemsImported.rewrites)
                            {
                                setTimeout(()=> location.reload(), 1000)
                            }
                        }, 1000)

                    }

                    file.readAsText(this.files[0])

                    createPleaseWaitModal("Importing settings")
                }

                const container = document.createElement("div")
                container.style = "display: flex; grid-gap: 20px; margin-top: 20px;"

                container.appendChild(exportConfigButton)
                container.appendChild(importConfigButton)
                container.appendChild(fileConfigInput)
                container.appendChild(exportNXButton)
                container.appendChild(importNXButton)
                container.appendChild(fileNXInput)

                document.querySelector(".card-body").appendChild(container)

            }

        }, 500)

    }
}





function loadNXsettings()
{
    readSetting("NXsettings", function(obj)
    {
        if (!obj.NXsettings)        // If it's running for the first time, store the following default settings.
        {
            saveSettings(
            {
                SecurityPage: { CollapseList: true },
                PrivacyPage:
                {
                    CollapseList: true,
                    SortAZ: false
                },
                AllowDenylistPage:
                {
                    SortAZ: false,
                    SortTLD: false,
                    Bold: false,
                    Lighten: false,
                    RightAligned: false,
                    MultilineTextBox: false,
                    DomainsDescriptions: {}     // In Chrome it's required to be an object to use named items. In Firefox it works even with an array.
                },
                LogsPage:
                {
                    ShowCounters: false,
                    DomainsToHide: ["nextdns.io", ".in-addr.arpa", ".ip6.arpa"]
                }
            })

        }

        readSetting("NXsettings", function(obj)
        {
            NXsettings = obj.NXsettings

            main()
        })
    })
}

function saveSettings(object)
{
    if (!object)  object = NXsettings

    if (isChrome)
        chrome.storage.local.set({NXsettings: object})
    else
        browser.storage.local.set({NXsettings: object})
}

function readSetting(settingName, callback)
{
    if (isChrome)
        chrome.storage.local.get(settingName, callback)
    else
        browser.storage.local.get(settingName).then(callback)
}


const SLDs = ["co","com","org","edu","gov","mil","net"]

function styleDomains(type, enable)
{
    if (type == "lighten" || type == "bold")
    {
        const items = document.querySelectorAll(".list-group-item span[class='notranslate']")

        for (let i=0; i < items.length; i++)
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
                {
                    const subdomainsText = items[i].innerHTML.replace(rootDomain, "<" + rootDomain).match(/\/span>(.*?)</)[1]
                    items[i].textContent = ""

                    const spanWildcard = document.createElement("span")
                    spanWildcard.style = "opacity: 0.3;"
                    spanWildcard.textContent = "*."
                    items[i].appendChild(spanWildcard)

                    const nodeSubdomains = document.createTextNode(subdomainsText)
                    items[i].appendChild(nodeSubdomains)

                    const spanRootDomain = document.createElement("span")
                    spanRootDomain.style = domainStyle
                    spanRootDomain.textContent = rootDomain
                    items[i].appendChild(spanRootDomain)
                }
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
        for (let i=1; i < domainContainers.length; i++)
        {
            const favicon = domainContainers[i].firstChild.querySelector("img")
            favicon.className = enable ? "ml-2" : "mr-2"
            domainContainers[i].firstChild.appendChild(enable ? domainContainers[i].firstChild.querySelector("img") : domainContainers[i].firstChild.querySelector("span"))        // Swap places for the favicon and domain
            domainContainers[i].style.justifyItems = enable ? "flex-end" : "initial"
            domainContainers[i].lastChild.style.textAlign = enable ? "right" : "left"
        }
    }
}


function createSwitchCheckbox(text)
{
    const container = document.createElement("div")
    container.className = "custom-switch"

    const checkbox = document.createElement("input")
    checkbox.type = "checkbox"
    checkbox.id = "id" + Date.now() * Math.random()   // There's no need to specify a human-readable id, but it needs to be unique.
    checkbox.className = "custom-control-input"

    const label = document.createElement("label")
    label.textContent = text
    label.style = "margin-left: 10px; user-select: none;"
    label.htmlFor = checkbox.id
    label.className = "custom-control-label"

    container.appendChild(checkbox)
    container.appendChild(label)

    return container
}


function createPleaseWaitModal(whatIsDoing)
{
    const hourGlass = document.createElement("span")
    hourGlass.style = "font-size: 40px; margin-top: -6px; margin-right: 20px;"
    hourGlass.innerText = "⏳"

    const message = document.createElement("div")
    message.innerText = whatIsDoing + ". This will take some seconds, please wait...\n The page will be reloaded when finished."

    const elementsContainer = document.createElement("div")
    elementsContainer.style = "background: white; z-index: 9999; position: fixed; top: 38vh; left: 33.3vw; padding: 20px; border-radius: 10px; display: flex; font-size: large; user-select: none;"
    elementsContainer.appendChild(hourGlass)
    elementsContainer.appendChild(message)

    document.body.appendChild(elementsContainer)

    const backdrop = document.createElement("div")
    backdrop.style = "background: black; position: fixed; top: 0; left: 0; z-index: 9998; opacity: 0.5; width: 100%; height: 100%;"

    document.body.appendChild(backdrop)

    const origBackdrop = document.getByClass("modal-backdrop")
    if (origBackdrop != null)  origBackdrop.remove()
}


function createSpinner(container)
{
    const spinner = document.createElement("span")
    spinner.className = "ml-2 spinner-border spinner-border-sm"
    spinner.style = "vertical-align: middle;"
    container.appendChild(spinner)
}


function createStylizedTooltipWithImgParent(imgSrc, innerHTML)
{
    const container = document.createElement("div")
    container.style.display = "inline-block"

    const icon = document.createElement("img")
    icon.src = imgSrc

    container.appendChild(icon)

    container.createStylizedTooltip(innerHTML)

    return container
}


function exportToFile(fileContent, fileName)
{
    fileContent = JSON.stringify(fileContent, null, 2)      // Turn the object into JSON text with 2 spaces indentation.
    const blob = URL.createObjectURL(new Blob([fileContent], {type: "text/plain"}))
    const a = document.createElement("a")
    a.href = blob
    a.download = fileName
    document.body.appendChild(a)
    a.click()
}


function sortItemsAZ(selector, type = "", element = null)
{
    const container = document.querySelector(selector)
    const items = Array.from(container.children)

    if (type == "domain")
    {
        let startingLevel = 1       // From last to first.

        if (!element.checked)       // If "Sort by TLDs" is disabled, skip the TLD.
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
                if (SLDs.includes(tempA[levelA]))    // If the domain before the TLD is a SLD, instead of a root domain ...
                    a = tempA[--levelA]              // ... skip it.

                if (SLDs.includes(tempB[levelB]))
                    b = tempB[--levelB]
            }

            while(true)  // Repeat until reaching a return
            {
                if      (a <  b) return -1
                else if (a >  b) return 1
                else if (a == b)    // If both items share the same domain ...
                {
                    levelA--        // ... then skip to a deeper level ...
                    levelB--

                    if (typeof tempA[levelA] != "undefined" && typeof tempB[levelB] != "undefined")  // ... but only if both have a deeper level.
                    {
                        a = tempA[levelA]
                        b = tempB[levelB]
                    }
                    else if (typeof tempA[levelA] == "undefined" && typeof tempB[levelB] != "undefined")  // This happens when an upper level domain is compared with a deeper level one.
                        return -1                                                                         // In this case, bring the upper level one to the top
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

            if      (a <  b) return -1
            else if (a >  b) return 1
            else if (a == b) return 0
        })
    }

    for (let i = 0; i < items.length; i++)
        container.appendChild(items[i])
}


function extendFunctions()
{
    Node.prototype.getByClass = function(className) { return this.getElementsByClassName(className)[0] }
    Node.prototype.secondChild = function() { return this.children[1] }
    Array.prototype.lastItem = function() { return this[this.length-1] }

    setIntervalOld = setInterval
    setInterval = function(f,t) { intervals.push(setIntervalOld(f,t));  return intervals.lastItem() }

    Node.prototype.createStylizedTooltip = function(innerHTML)
    {
        const tooltipDiv = document.createElement("div")
        const innerNodes = (new DOMParser).parseFromString(innerHTML, "text/html").body.childNodes       // It's required to parseFromString the HTML in order to pass AMO's code validation.

        for (let i=0; i < innerNodes.length; i++)
            tooltipDiv.appendChild(innerNodes[i])

        tooltipDiv.className = "customTooltip"
        tooltipDiv.style = 'position: absolute; background: #333; color: white; z-index: 99; font-family: var(--font-family-sans-serif); padding: 7px; font-size: 11px; font-weight: initial; \
                            text-align: center; border-radius: 5px; line-height: 20px; margin-top: 10px; min-width: 3.2cm; max-width: 5.5cm; visibility: hidden; opacity: 0; transition: 0.2s;'

        this.appendChild(tooltipDiv)
        this.classList.add("tooltipParent")
    }
}


function clearAllIntervals()
{
    for (let i=0; i < intervals.length; i++)
        clearInterval(intervals[i])

    const counters = document.getElementById("visibleEntriesCount")
    if (counters)  counters.parentElement.remove()
}


function hideAllListItemsAndCreateButton(text, settingObject)
{
    const items = document.querySelector(".list-group").children

    if (settingObject.CollapseList)
    {
        // Hide items

        for (let i = 1; i < items.length; i++)
            items[i].style.cssText += "display: none;"
    }


    // Create the "Collapse the list" switch

    let collapseSwitch = document.getElementById("collapseSwitch")

    if (!collapseSwitch)
    {
        collapseSwitch = createSwitchCheckbox("Collapse the list")
        collapseSwitch.id = "collapseSwitch"
        collapseSwitch.style = "padding-left: 0px; margin-top: 15px;"
        collapseSwitch.lastChild.style = "margin-top: 5px; margin-left: 37px;"
        collapseSwitch.firstChild.checked = settingObject.CollapseList
        collapseSwitch.firstChild.onchange = function()
        {
            settingObject.CollapseList = this.checked
            saveSettings()

            const showButton = document.getElementById("showButton")

            if (this.checked)
                hideAllListItemsAndCreateButton(text, settingObject)
            else
                showButton.click()
        }
    }

    // Create "Show" button

    let showButton = document.getElementById("showButton")

    if (!showButton)
    {
        showButton = document.createElement("button")
        showButton.id = "showButton"
        showButton.className = "btn btn-light"
        showButton.style = "margin-right: 100px; display: none;"
        showButton.textContent = text
        showButton.onclick = function()
        {
            for (let i = 1; i < items.length; i++)
                items[i].style.cssText += "display: block;"
        }

        collapseSwitch.insertBefore(showButton, collapseSwitch.firstChild)
    }

    if (settingObject.CollapseList)  showButton.style.display = "initial"

    document.querySelector(".list-group-item").appendChild(collapseSwitch)
}


function convertToHex(string)
{
    let hex = ""

    for (let i=0; i < string.length; i++)
        hex += string.charCodeAt(i).toString(16)

    return hex
}


function makeApiRequest(HTTPmethod, requestString, callback, requestBody = null)
{
    const requestURL = "https://api.nextdns.io/configurations/" + location.href.split("/")[3] + "/" + requestString     // Update the URL for each request. This ensures that the request will be made to the correct config.

    if (HTTPmethod == "PATCH" || HTTPmethod == "POST")
        requestBody = JSON.stringify(requestBody)

    const xhr = isChrome ? new XMLHttpRequest() : XPCNativeWrapper(new window.wrappedJSObject.XMLHttpRequest())         // For Firefox, it's required to call XMLHttpRequest inside this wrapper, otherwise the call is ignored. In Chrome it works fine.
    xhr.open(HTTPmethod, requestURL)
    xhr.setRequestHeader("Content-Type", "application/json;charset=utf-8")          // This is required when sending data in the request body to the server, otherwise it returns an internal server error (500). In other cases, it's optional.
    xhr.onload = function() { if (callback)   callback(xhr.response) }
    xhr.onerror = function()
    {
        // When there's a network problem while making a request, try again after 5 seconds

        setTimeout(function() {
            makeApiRequest(HTTPmethod, requestString, callback, requestBody)
        }, 5000)
    }
    xhr.withCredentials = true                                                      // Include the session cookie in the request, otherwise it responds with "Forbidden".
    xhr.send(requestBody)

}
