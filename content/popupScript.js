chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {

    if (message.action == 'displayPopup') {

        const isSafe = message.isSafe;
        console.log("Content script: received summary");
        
        chrome.runtime.sendMessage({ 
            action: 'createPopup',
            data: {
                linkType: message.linkType,
                isSafe: isSafe,
            }
        });
    } 

    else if (message.action === 'updatePopup') {
        const summary = message.summaryText;
        const title = message.title;
        const url = message.url
        updatePopup(title, summary, url);
    }

});

function injectScript(url, callback) {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL(url);
    script.onload = callback;
    document.head.appendChild(script);
}

let bookmarkHandler = null;

function updatePopup(title, summary, url) {
    // console.log("Entered update popup function:" + title);

    const titleDiv = document.getElementById('popup-title');
    if (!titleDiv) return;

    titleDiv.innerHTML = title;

    const summaryDiv = document.getElementById('popup-summary');
    summaryDiv.style.textAlign = "left";
    if (!summaryDiv) return;

    const bookmarkButton = document.getElementById("bookmarkButton");

    // Remove any existing event listener only once, with the reference to the handler
    if (bookmarkHandler) {
        bookmarkButton.removeEventListener("click", bookmarkHandler);
    }

    // Define the bookmark handler once
    bookmarkHandler = function () {
        const bookmarkData = {
            id: Date.now(),
            title: title,
            summary: summary,
            url: url
        };

        // send message to the background.js to send to the bookmarkScript.js for saving the bookmark
        chrome.runtime.sendMessage({
            action: 'saveBookmark',
            data: bookmarkData
        });

        bookmarkButton.disabled = true;
    };

    bookmarkButton.addEventListener("click", bookmarkHandler);

    // Markdown conversion (not working)
    if (typeof marked !== 'undefined') {
        summaryDiv.innerHTML = marked.parse(summary);
    } else {
        summaryDiv.innerHTML = summary;
    }
}

