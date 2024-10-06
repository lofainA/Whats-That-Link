// Listen for messages from other scripts (like popup.js)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'saveBookmark') {
        bookmarkLink(message.data);
        sendResponse({ status: 'success' });
    }

    if(message.action === "deleteBookmark") {
        deleteBookmarkFunction(message);
    }
});

// This function handles bookmarking the summary and link.
function bookmarkLink(bookmarkData) {

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

        const saveStatus = document.createElement('div');
        saveStatus.style.display = 'flex';
        saveStatus.style.gap = '5px';
        saveStatus.style.marginLeft = '7px';

        chrome.storage.local.set({ bookmarks: bookmarks }, () => {
            if (chrome.runtime.lastError) {
                saveStatus.innerHTML = `
                        <i class="fa-regular fa-circle-xmark" style="color: #e71313;"></i>
                        <p style="font-size: 12px; color: #e71313;">Could not save bookmark :(</p>
                `;
                console.error("Error saving bookmark:", chrome.runtime.lastError);
            } else {
                saveStatus.innerHTML = `
                        <i class="fa-regular fa-circle-check" style="color: #2fc51b;"></i>
                        <div style="font-size: 12px; color: #2fc51b;">Bookmark saved!</div>
                `;
                console.log('Bookmark saved:', bookmarkData);
            }

            const parent = document.getElementById("bm-btn-div");
            parent.appendChild(saveStatus);
        });
    });

    // Displays all bookmarks in console
    chrome.storage.local.get({ bookmarks: [] }, (result) => {
        const bookmarks = result.bookmarks;
        bookmarks.forEach(bookmark => {
            console.log(`ID: ${bookmark.id}, Title: ${bookmark.title}, URL: ${bookmark.url}, Summary: ${bookmark.summary}`);
        });
    });
}

const deleteBookmarkFunction = (message) => {
    // Delete Bookmark
    chrome.storage.local.get(['bookmarks'], (result) => {
        let newBookmarks = result.bookmarks || [];
    
        const bookmarkIdToRemove = message.id;
    
        // Filter out the bookmark with the given id
        newBookmarks = newBookmarks.filter(bookmark => bookmark.id !== bookmarkIdToRemove);
    
        // Set the updated bookmarks array back to storage
        chrome.storage.local.set({ bookmarks: newBookmarks }, () => {
            console.log('Bookmark removed and storage updated.');
        });
    });
}


