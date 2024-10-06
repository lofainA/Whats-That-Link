chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.action === 'fetchAndParse') {
        console.log("Entered Parser script");
        const linkUrl = message.url;
        console.log("URl: " + linkUrl);

        try {
            // fetch the HTML content of the URL
            const response = await fetch(linkUrl);
            if (!response.ok)
                throw new Error(`HTTP error! Status: ${response.status}`);

            const html = await response.text();

            // parse the HTML to extract text
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            let pageTitle = doc.querySelector('title').innerText;
            const visibleText = extractVisibleText(doc);  // extract only the texts from the body

            // send the text to the background for summarization
            chrome.runtime.sendMessage({
                action: 'summarizeText', 
                text: visibleText, 
                title: pageTitle, 
                url: message.plainUrl,
                linkType: message.linkType,
            });

        } catch (error) {
            console.error('Error fetching or parsing HTML:', error);
            // Send a default response in case of an error
            chrome.runtime.sendMessage({ action: 'summarizeText', text: "We've run into an error while fetching your content, could you please try again? ", title: "We're sorry :(", linkType: message.linkType });
        }
    }
});

/**
 * Extract visible text from a Document
 * @param {Document} doc - The parsed HTML document
 * @returns {string} - The visible text content
 */

function extractVisibleText(doc) {
    // remove script and style elements
    doc.querySelectorAll('script, style').forEach(el => el.remove());

    // get all the text nodes
    const textNodes = [];
    const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null, false);

    let node;
    while (node = walker.nextNode()) {
        textNodes.push(node.textContent.trim());
    }

    // join text nodes and clean up (filter) the text
    return textNodes.filter(text => text.length > 0).join(' ');
}