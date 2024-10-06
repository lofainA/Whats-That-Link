
// Context Menu Creation
chrome.contextMenus.create({ 
    title: "What's that link?", 
    contexts: ['link'], 
    id: 'summarizeLink' 
});

// Context Menu initialization
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'summarizeLink') {

        // Uncomment and use context menu to clear local storage

        // chrome.storage.local.clear(function() {
        //     var error = chrome.runtime.lastError;
        //     if (error) {
        //         console.error(error);
        //     }
        // });
        // chrome.storage.sync.clear(); 

        const linkUrl = info.linkUrl;
        const currentDomain = new URL(tab.url).hostname;

        const linkType = identifyLinkType(linkUrl, currentDomain);
        console.log(linkType[0]);

        const isSafe = await checkLinkSafety(linkUrl);
        console.log('Link safety:', isSafe ? 'Safe' : 'Unsafe');

        chrome.tabs.sendMessage(tab.id, {action: 'displayPopup', linkType: linkType[0], isSafe: isSafe}) // (tab, action)

        if (linkType[0] === 'internal' || linkType[0] === 'external') {
            sendProxiedLink(info, tab, linkType, isSafe);
        } 

        // ongioing ...
        else if (linkType[0] === 'download') {
            fileExtension = linkType[1];
        }
    }
});

// Link categorization
function identifyLinkType(linkUrl, currentDomain) {

    const downloadExtensions = ['.pdf', '.zip', '.jpg', '.png', '.mp3', '.mp4', '.doc', '.xls', '.exe', '.docx', '.apk'];
    const fileExtension = linkUrl.slice(linkUrl.lastIndexOf('.')).toLowerCase();

    // Check if the link is an internal link
    const isInternal = linkUrl.includes(currentDomain);

    // Check if the link is a download link
    const isDownload = downloadExtensions.some(ext => fileExtension === ext);
    let type;
    // Determine the type of link
    if (isDownload) {
        type = 'download';
    } else if (isInternal) {
        type = 'internal';
    } else {
        type = 'external';
    }

    const linkInfo = [type, isDownload ? fileExtension : null];
    return linkInfo;
}


async function sendProxiedLink(info, tab, linkType) {

    const linkUrl = info.linkUrl;

    const corsProxy = 'http://localhost:8080/';
    const proxiedUrl = corsProxy + linkUrl;

    try {
        //sends the URL to the contentScript
        chrome.tabs.sendMessage(tab.id, { action: 'fetchAndParse', url: proxiedUrl, linkType: linkType });
        console.log("Sent message to parser script");
    } catch (error) {
        console.error('Error sending URL to content script:', error);
    }
}

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyA5h89GaEy6DlnEV0s_fsBQXvKN4wKxzaM';

    if (message.action === 'summarizeText') {
        const textContent = message.text;

        let prompt = "";

        if(textContent === "") {
            prompt = "";
        }
        try {
            let response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
        
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Summarize this webpage very shortly without using filler text and being straight to the point and if it is about a particuar topic dont talk about the website and just talk abou the topic and never use markdown syntax: ${textContent}`
                        }]
                    }]
                })
            })
    
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
        
            let data = await response.json();
            console.log('Fetch data received:', data);
    
            // Take only the summary text
            if(data.candidates[0].content) {
                const summary = data.candidates[0].content.parts[0].text;
    
                chrome.tabs.sendMessage(sender.tab.id, { action: 'updatePopup', summaryText: summary, title: message.title });
            } 
            
            else {
                console.log("Error occured");
                chrome.scripting.executeScript({
                    target: {tabId: sender.tab.id},
                    func: (message) => alert(message),
                    args: ["Sorry could you try again?"]
                });
            }
        } 
    
        catch (error) {
            console.error('Error during fetch or processing:', error);
            chrome.scripting.executeScript({
                target: {tabId: tab.id},
                func: (errorMessage) => alert(errorMessage),
                args: [error.message]
            });
        }
    }
});

async function checkLinkSafety(linkUrl) {
    const safeBrowsingAPI = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=AIzaSyCczjH1d70T3uCAjvmCOCxVV8o5TdAkeOw`;

    const body = {
        client: {
            clientId: "your-client-id",
            clientVersion: "1.0"
        },
        threatInfo: {
            threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [
                { url: linkUrl }
            ]
        }
    };

    try {
        const response = await fetch(safeBrowsingAPI, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        // If the response contains matches, the link is unsafe
        if (data.matches && data.matches.length > 0) {
            return false;
        } else {
            return true;
        }
    } catch (error) {
        console.error('Error checking link safety:', error);
        return false;  // Assume unsafe if error occurs
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'bookmark') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
                sendResponse(response);
            });
        });
        return true; 
    }

    if (message.action === 'displayBookmarks') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
                sendResponse(response);
            });
        });
        return true; 
    }

    if(message.action == 'createPopup') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
                sendResponse(response);
            });
        });
        return true;
    }
});

