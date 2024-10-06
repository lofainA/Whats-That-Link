// Listen for messages from other scripts (like popup.js)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'bookmark') {
        bookmarkSummary(message.data);
        sendResponse({ status: 'success' });
    }
});

// This function handles bookmarking the summary and link.
function bookmarkSummary(bookmarkData) {

    if (!bookmarkData) {
        console.error("Bookmark data is undefined.");
        return;
    }

    if(!chrome.storage) {
        console.error("chrome.storage is undefined.");
        return;
    }

    // Save the bookmark to Chrome session storage
    chrome.storage.local.get({ bookmarks: [] }, (result) => {
        const bookmarks = result.bookmarks || [];
        bookmarks.push(bookmarkData);

        chrome.storage.local.set({ bookmarks: bookmarks }, () => {
            if (chrome.runtime.lastError) {
                console.error("Error saving bookmark:", chrome.runtime.lastError);
            } else {
                console.log('Bookmark saved:', bookmarkData);
            }
        });
    });

    // Check bookmark saved
    chrome.storage.local.get({ bookmarks: [] }, (result) => {
        const bookmarks = result.bookmarks;
        bookmarks.forEach(bookmark => {
            console.log(`ID: ${bookmark.id}, Title: ${bookmark.title}, URL: ${bookmark.url}, Summary: ${bookmark.summary}`);
        });
    });
}


