chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if(message.action === 'updateRating') {
        calculateRating(message.report);
        sendResponse({status: 'success'});
    }
});

const calculateRating = (report) => {
    // Ensure the report has the 'stats' attribute before proceeding
    if (!report.data.attributes || !report.data.attributes.stats) {
        console.error("Invalid report structure", report);
        return "No data available for rating";
    }
    
    // Correctly access the stats
    const maliciousVotes = report.data.attributes.stats.malicious || 0;
    const suspiciousVotes = report.data.attributes.stats.suspicious || 0;
    const undetectedVotes = report.data.attributes.stats.undetected || 0;
    const harmlessVotes = report.data.attributes.stats.harmless || 0;

    // Total votes
    const totalVotes = maliciousVotes + suspiciousVotes + undetectedVotes + harmlessVotes;

    if (totalVotes === 0)
        return "No data available for rating";

    // Weighted score calculation
    const maliciousWeight = 0;
    const suspiciousWeight = 0.2;
    const undetectedWeight = 0.5;
    const harmlessWeight = 1.0;

    const weightedScore = (
        (maliciousVotes * maliciousWeight) +
        (suspiciousVotes * suspiciousWeight) +
        (undetectedVotes * undetectedWeight) +
        (harmlessVotes * harmlessWeight)
    ) / totalVotes;

    // Normalize the score to a scale of 10
    const ratingOutOf10 = weightedScore * 10;
    console.log("calculated rating ", ratingOutOf10);

    updateRating(ratingOutOf10.toFixed(1));
};


const updateRating = (rating) => {
    const tagDiv = document.getElementById('tags-div');

    if(!tagDiv) { 
        console.log("tags-div not true");
        return; 
    };

    const ratingTag = document.createElement('span');

    if(document.getElementById('rating')) {
        document.getElementById('rating').remove();
    };

    ratingTag.innerHTML = `
        <span id="rating" style="
            margin-top: 7px;
            font-size: 12px; 
            padding: 3px 7px; 
            margin-bottom: 5px;
            border-radius: 7px; 
            background-color: #CACACA;
            color: white;
            width: fit-content;
            font-family: 'Segoe UI';">
                ${rating}
        </span>`
    tagDiv.appendChild(ratingTag);
    if(document.getElementById('rating')) {
        console.log("Successfully updated rating");
    } else {
        console.log("Could not update rating tag");
    }
};