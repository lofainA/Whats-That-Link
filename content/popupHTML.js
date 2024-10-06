chrome.runtime.onMessage.addListener((message, sender, sendResponse) => { 
    if(message.action == 'createPopup') {
        createPopup(message.data.linkType, message.data.isSafe);
        sendResponse({ status: 'success' });
    }

    if(message.action == 'displayBookmarks') {
        displayBookmarks(message.flag);
        sendResponse({ status: 'success' });
    }
});

function createPopup (linkType, isSafe) {

    // Check if a popup already exists and remove it if so
    const existingPopup = document.getElementById("popupContainer");
    if (existingPopup) {
        existingPopup.remove();
    }

    let linkTypeText = 'text';
    let linkTypeColor = 'white';
    let safetyText = isSafe ? 'Safe' : 'Unsafe';
    let safetyColor = isSafe ? '#2ECC71' : '#E74C3C';

    if(linkType === 'internal') {
        linkTypeText = 'Internal';
        linkTypeColor = '#00A8FF'; //blue
    } else if (linkType === 'external') {
        linkTypeText ='External';
        linkTypeColor = '#FBC531'; //yellow
    } else if (linkType === 'download') {
        linkTypeText = 'Download';
        linkTypeColor = '#9C88FF'; //lavender
    } 

    // for the favicon icon of close button
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css';
    document.head.appendChild(link);

    // html for the popup element
    const popup = document.createElement("div");
    popup.id = "popupContainer";
    popup.style.fontFamily = "'Segoe UI', 'lato, 'Helvetica, sans-serif"
    popup.style.display = "flex";
    popup.style.flexDirection = "column";
    popup.style.justifyContent = "start";
    popup.style.position = "fixed";
    popup.style.top = "10px";
    popup.style.right = "10px";
    popup.style.width = "300px";
    popup.style.backgroundColor = "#fff";
    popup.style.border =  "none"//"1px solid #ccc";
    popup.style.borderRadius = "15px";
    popup.style.padding = "24px";
    popup.style.zIndex = 100000;
    popup.style.boxShadow = "0px 0px 10px rgba(0,0,0,0.1)";
    popup.style.lineHeight = "1.4";
    popup.style.textAlign = "left";
    popup.style.maxHeight = "650px";

    popup.innerHTML = `
        <body>
            <button id="closeButton" 
                    style="align-self: end; 
                    position: absolute; top: 10px; 
                    right: 10px; 
                    background: transparent; 
                    border: none; 
                    color: #CACACA; 
                    cursor: pointer;">
                <i class="fas fa-times"></i>
            </button>
            <div style="display: flex; align-items: flex-start; gap: 7px">
                <span style="
                    font-size: 12px; 
                    padding: 3px 7px; 
                    margin-bottom: 5px;
                    border-radius: 7px; 
                    background-color: ${linkTypeColor};
                    color: white;
                    width: fit-content;
                    font-family: 'Segoe UI';">
                        ${linkTypeText}
                </span>
                <span style="
                    font-size: 12px; 
                    padding: 3px 7px; 
                    margin-bottom: 5px;
                    border-radius: 7px; 
                    background-color: ${safetyColor};
                    color: white;
                    width: fit-content;
                    font-family: 'Segoe UI';">
                        ${safetyText}
                </span>
            </div>
            <h3 id="popup-title" style="font-size: 16px;  
                                        color: black;">
                        What's that link?
            </h3>
            <hr style="color: #CACACA; width: 100%; border-top: 1px solid #CACACA">
            <div id="popup-summary" style="font-size: 12px; color: #494949; text-align: center;">
                <div style="border: 1px solid #f3f3f3
                            border-top: 4px solid #3498db;
                            border-radius: 50%;
                            width: 24px;
                            height: 24px;
                            animation: spin 1s linear infinite;"></div>
                <p>Loading summary...</p>
            </div>
            <button id="bookmarkButton" style="margin-top: 10px; 
                                                background-color: transparent; 
                                                border: 1px solid #D24545; 
                                                color: #D24545;
                                                padding: 8px 12px; 
                                                border-radius: 5px; 
                                                cursor: pointer; 
                                                width: fit-content; 
                                                align-self: flex-end;
                                                font-family: 'Segoe UI';
                                                font-size: 12px;">
                Bookmark
            </button>
            <button id="showBookmarks" style="border: none;
                                              background-color: transparent;
                                              padding: 8px 12px; 
                                              cursor: pointer;">
                <i id="showIcon" class='fa-solid fa-sort-down'></i>
            </button>
        </body>
    `; 
  
    document.body.appendChild(popup);

    const closeButton = document.getElementById("closeButton");
    if (closeButton) {
        closeButton.addEventListener("click", () => {
            popup.remove();  
        });
    }

    const bookmarkButton = document.getElementById('bookmarkButton');

    bookmarkButton.addEventListener('mouseenter', () => {
        bookmarkButton.style.backgroundColor = '#D24545';
        bookmarkButton.style.color = 'white';
    });

    bookmarkButton.addEventListener('mouseleave', () => {
        bookmarkButton.style.backgroundColor = 'transparent';
        bookmarkButton.style.color = '#D24545';
    });

    const showBookmarksButton = document.getElementById('showBookmarks');

    let flag = false;

    // send call to background.js for showing the bookmarks dropdown list
    showBookmarksButton.addEventListener('click', () => {
        flag = !flag;
        chrome.runtime.sendMessage({
            action: 'displayBookmarks',
            flag: flag
        })
    });
}

function displayBookmarks(flag) {
    if(flag === true) {

        const showIcon = document.getElementById('showIcon');
        showIcon.className = 'fa-solid fa-sort-up';

        const bookmarkList = document.createElement('div');

        const popupSummary = document.getElementById('popup-summary');
        const bookmarkButton = document.getElementById('bookmarkButton');
        popupSummary.style.display = "none";
        bookmarkButton.style.display = "none";
        // var popupHeight = document.getElementById('popupContainer').clientHeight;
        bookmarkList.style.overflowY = "scroll";
        // bookmarkList.style.height = `${650 - popupHeight}px`;
        bookmarkList.id = "bookmarkList";
        

        chrome.storage.local.get({ bookmarks: [] }, (result) => {
            const bookmarks = result.bookmarks;
            bookmarks.forEach(bookmark => {
                var bookmarkCell = document.createElement('div');
                bookmarkCell.innerHTML = `
                    <div style="display: flex;
                                justify-content: space-between;
                                align-items: center;">
                        <div id="bm-desc">
                            <h4 id="bm-title" style="font-size: 14px;">
                                ${bookmark.title} 
                            </h4>
                            <u><a href="${bookmark.url}">URL</a><u>
                            <a class="delete-bookmark" style="color: red; padding-left: 8px;">Delete</a>
                        </div>
                        <button style="background: transparent;
                                       border: none;
                                       cursor: pointer;"
                                class="toggle-summary" >
                            <i class="fa-solid fa-chevron-down"></i>
                        </button>
                    </div>
                    
                    <div class="bm-summary" style="display: none;
                                                border: 1px solid #CACACA;
                                                border-radius: 5px;
                                                padding: 8px;
                                                font-size: 11px;
                                                margin-top: 7px;">
                        ${bookmark.summary}
                    </div>
                    <hr style="color: #CACACA; width: 100%; border-top: 1px solid #CACACA; margin-top: 5px;">
                `;
                bookmarkList.appendChild(bookmarkCell);

                let sumFlag = false;

                const toggleButton = bookmarkCell.querySelector('.toggle-summary');
                const summaryDiv = bookmarkCell.querySelector('.bm-summary');

                toggleButton.addEventListener('click', () => {
                    sumFlag = !sumFlag;

                    if(sumFlag) {
                        summaryDiv.style.display = "inline-block";
                    }
                    else {
                        summaryDiv.style.display = "none";
                    }
                });

                const deleteBookmark = bookmarkCell.querySelector('.delete-bookmark');
                deleteBookmark.addEventListener('click', () => {
                    bookmarkCell.style.display = 'none';

                    chrome.storage.local.get(['bookmarks'], (result) => {
                        let newBookmarks = result.bookmarks || [];
                    
                        const bookmarkIdToRemove = bookmark.id;
                    
                        // Filter out the bookmark with the given id
                        newBookmarks = newBookmarks.filter(bookmark => bookmark.id !== bookmarkIdToRemove);
                    
                        // Set the updated bookmarks array back to storage
                        chrome.storage.local.set({ bookmarks: newBookmarks }, () => {
                            console.log('Bookmark removed and storage updated.');
                        });
                    });
                });
                //console.log(`Title: ${bookmark.title}, URL: ${bookmark.url}, Summary: ${bookmark.summary}`);
            });
        });

        const popup = document.getElementById('popupContainer');
        popup.appendChild(bookmarkList);

        // const summaryButton = document.getElementById('bm-summary');

        // if(summaryButton) {

        // }
    }

    else if (flag === false) {

        const popupSummary = document.getElementById('popup-summary');
        const bookmarkButton = document.getElementById('bookmarkButton');
        popupSummary.style.display = "inline-block";
        bookmarkButton.style.display = "inline-block";

        const popup = document.getElementById('popupContainer');
        const bookmarkList = document.getElementById('bookmarkList');
        popup.removeChild(bookmarkList);

        showIcon.className = 'fa-solid fa-sort-down';
    }
}