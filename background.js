
// Context Menu Creation
chrome.contextMenus.create({ 
    title: "What's that link?", 
    contexts: ['link'], 
    id: 'summarizeLink' 
});

// Context Menu initialization
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'summarizeLink') {

        const linkUrl = info.linkUrl;
        const currentDomain = new URL(tab.url).hostname;

        const linkType = identifyLinkType(linkUrl, currentDomain);
        console.log(linkType[0]);

        const isSafe = await checkLinkSafety(linkUrl);
        console.log('Link safety:', isSafe ? 'Safe' : 'Unsafe');

        chrome.tabs.sendMessage(tab.id, {action: 'displayPopup', linkType: linkType[0], isSafe: isSafe}) 

        if (linkType[0] === 'internal' || linkType[0] === 'external') {
            sendProxiedLink(info, tab, linkType, isSafe);
        } 

        // ongioing ...
        else if (linkType[0] === 'download') {
            fileExtension = linkType[1];
        }

        const rating = await getUrlRatings(linkUrl, tab);
        console.log(rating);
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
        chrome.tabs.sendMessage(tab.id, { action: 'fetchAndParse', url: proxiedUrl, linkType: linkType, plainUrl: linkUrl });
        console.log("Sent message to parser script");
    } catch (error) {
        console.error('Error sending URL to content script:', error);
    }
}

// Gemini API comms
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
    
                chrome.tabs.sendMessage(sender.tab.id, { action: 'updatePopup', summaryText: summary, title: message.title, url: message.url });
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

// Safe browsing API comms
const checkLinkSafety = async (linkUrl) => {
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

// virusTotal api key
const apiKey = 'ff01f664ef0ae500365ab56607ecde80d505cf09c2089f54a9554916004c446e';

// Main function to scan and get the report
async function getUrlRatings(linkUrl, tab) {
    try {
        const analysisId = await submitURLForScan(linkUrl);
        
        setTimeout(async () => {
            const result = await getAnalysisResult(analysisId);
            console.log("Analysis report:", result);

            chrome.tabs.sendMessage(tab.id, {action: 'updateRating', report: result}, (response)=> {
                if(chrome.runtime.lastError) {
                    console.error("Error:", chrome.runtime.lastError);
                }
                else {
                    if(response.status === 'success') {
                        console.log("Rating updated successfully!");
                    } else {
                        console.log("Failed to update rating.");
                    }
                }
            });
        }, 20000);  
        
    } catch (error) {
        console.error("Error:", error);
    }
}

// Function to submit the URL for scanning
async function submitURLForScan(url) {
    const urlEncoded = encodeURIComponent(url);

    const response = await fetch('https://www.virustotal.com/api/v3/urls', {
        method: 'POST',
        headers: {
            'x-apikey': apiKey,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `url=${urlEncoded}`
    });

    const data = await response.json();
    const analysisId = data.data.id;
    
    console.log("Analysis ID:", analysisId);
    return analysisId;
}

// Function to poll for the analysis result using the ID
async function getAnalysisResult(analysisId) {
    const url = `https://www.virustotal.com/api/v3/analyses/${analysisId}`;
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'x-apikey': apiKey
        }
    });

    const result = await response.json();
    console.log("Analysis report in getAnalysisResult: " , result)
    return result;
}

// Communication between content scripts 
// Actions: 6, 7, 4, 8

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'saveBookmark') {
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

    if(message.action == 'deleteBookmark') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
                sendResponse(response);
            });
        });
        return true;
    }
});

