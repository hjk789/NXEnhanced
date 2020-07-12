// ==UserScript==
// @name     		NX Enhancer
// @description 	Adds quality-of-life features to NextDNS website for a more practical experience
// @author		BLBC (github.com/hjk789, reddit.com/u/dfhg89s7d89)
// @version  		0.1
// @downloadURL 	https://raw.githubusercontent.com/hjk789/NXEnhancer/master/NXEnhancer.user.js
// @grant    		none
// @match	  	https://my.nextdns.io/*
// ==/UserScript==

page = ""
domain = ""

setInterval(function() 
{
  if (page != location.href)
  { 
    page = location.href
    
    
    // ---------------------- Logs page -------------------------
    
    
    if (/logs$/.test(location.href))
    {
      // Allow/Deny buttons on hover. Don't show the Allow button to already whitelisted domains, and don't show the Deny button to already blocked/whitelisted domains
      
      style=document.createElement("style")
      style.innerHTML = `.list-group-item:not([style*='rgb(46']):hover .btn-success { visibility: visible !important; }
                         .list-group-item:not([style*='rgb']):hover .btn-danger { visibility: visible !important; }` 
      document.body.appendChild(style)      
      
      waitForItems = setInterval(function() 
      {
        if (/logs$/.test(location.href))
        {        
          queries = document.querySelectorAll("div:only-child > img + span[class='notranslate']") // domain name element
          if (queries.length > 0)
          {
            // Create iframes with the Allowlist/Denylist pages
            
            iframeAllow = document.createElement("iframe")
            iframeAllow.src = "./allowlist"
            iframeAllow.className = "iallow"
            iframeAllow.style = "position: absolute; right: 130px; height: 110px; width: 300px; visibility: hidden;"

            iframeDeny = document.createElement("iframe")
            iframeDeny.src = "./denylist"
            iframeDeny.className = "ideny"
            iframeDeny.style = iframeAllow.style.cssText

            document.querySelector(".list-group").appendChild(iframeAllow)
            document.querySelector(".list-group").appendChild(iframeDeny)
            document.body.onclick = function() { 
              iframeAllow.style.cssText += 'visibility:hidden'; 
              iframeDeny.style.cssText += 'visibility:hidden'; 
            }

            for (i=0; i < queries.length; i++)
            {
              // Hide nextdns.io queries and Chrome's random queries

              domainToHide = "nextdns.io"        
              if (queries[i].parentElement.textContent.includes(domainToHide) || !queries[i].parentElement.textContent.includes(".")) 
              {
                // Although the line gets pretty long, navigating from the tree is much faster than doing a querySelector
                
                queries[i].parentElement.parentElement.parentElement.style = "display:none"
                queries[i].parentElement.parentElement.parentElement.className = ""
                queries[i].className = ""
                continue
              }

              // Create the Allow/Deny buttons

              allow = document.createElement("button")
              allow.className = "btn btn-success"
              allow.innerHTML = "Allow"
              allow.style = "position:absolute; right: 200px; visibility: hidden;"
              setOnClickButton(allow, iframeAllow, iframeDeny, 330)              

              deny = document.createElement("button")
              deny.className = "btn btn-danger"
              deny.innerHTML = "Deny"
              deny.style = "position:absolute; right: 300px; visibility: hidden;"
              setOnClickButton(deny, iframeDeny, iframeAllow, 258)              

              queries[i].parentElement.parentElement.parentElement.style.cssText += "position: relative;"
              queries[i].parentElement.parentElement.appendChild(allow)
              queries[i].parentElement.parentElement.appendChild(deny)
            }
          }
        }
        else clearInterval(waitForItems)
        
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
          event.stopPropagation()	// don't raise this event to the body, as it hides the iframes when clicked
        }
      }


      waitForInputboxAllow = setInterval(function() { setupInputBox(iframeAllow, waitForInputboxAllow ) }, 500);
      waitForInputboxDeny  = setInterval(function() { setupInputBox(iframeDeny,  waitForInputboxDeny  ) }, 500);
      
      
      function setupInputBox(frame, waitForInputbox)
      {
        if (frame.contentDocument != null && frame.contentDocument.forms[0] != null) 
        {
          frame.contentDocument.body.style = "overflow: hidden;"
          input = frame.contentDocument.forms[0].children[0]
          input.parentElement.parentElement.style.cssText += "padding-bottom: 30px;"
          input.parentElement.parentElement.parentElement.parentElement.style = "padding: 0px;"
          input.onkeyup = function(event) 
          {
            input = frame.contentDocument.forms[0].children[0]
            textSpan = input.parentElement.previousElementSibling // status message
                        
            if (event.key == ' ' || event.key == "Enter") 
            { 
              textSpan.innerHTML = "Submitting..."
              if (event.key == ' ')
              {                
                // Simulate Enter key press to submit, because form.submit() just redirects to ./logs#submit instead of submitting,
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

          span = frame.contentDocument.createElement("span")
          span.style = "line-height: 3;"
          span.innerHTML = "Press Space to confirm allow..."
          input.parentElement.parentElement.insertBefore(span, input.parentElement)

          clearInterval(waitForInputbox)
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
          
          lists = document.querySelector(".list-group").children
          
          for (i=1; i < lists.length; i++)
            lists[i].style.cssText += "display: none;"

          // Create "Show lists" button

          showLists = document.createElement("button")
          showLists.className = "btn btn-primary"
          showLists.style = "position:absolute;right: 200px;top: 30px;"
          showLists.innerHTML = "Show added lists"
          showLists.onclick = function() {
            for (i=1; i < lists.length; i++)
              lists[i].style.cssText += "display: block;"
          }

          lists[0].style += "position: relative;"
          lists[0].appendChild(showLists)


          // Sort blocklists alphabetically in the modal

          document.querySelector(".card-footer button").onclick = function() 
          {
            waitForListsModal = setInterval(function() 
            {
              if (document.querySelector(".modal-body .list-group-item") != null)
              {           
                clearInterval(waitForListsModal)
                
                tempLists = Array.from(document.querySelectorAll(".modal-body .list-group-item"))
                tempLists.sort(function(a, b) {
                  if (a.textContent.toLowerCase() < b.textContent.toLowerCase()) return -1
                  else if (a.textContent.toLowerCase() > b.textContent.toLowerCase()) return 1
                  else if (a.textContent.toLowerCase() == b.textContent.toLowerCase()) return 0
                })                
                
                modal = document.querySelector(".modal-body .list-group")
                
                for (i=0; i < tempLists.length; i++)
                  modal.appendChild(tempLists[i])
                
              }
            }, 500)
          }
          
          
        }
      }, 500)
      
      
    }
    
    
    
  }
}, 2000)
