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
    if (message.action === 'updatePopup') {
        const summary = message.summaryText;
        const title = message.title;
        const url = message.url
        updatePopup(title, summary, url);
    }
});

let bookmarkHandler = null;

function updatePopup(title, summary, url) {
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
        // Send message to the background.js to send to the bookmarkScript.js for saving the bookmark
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