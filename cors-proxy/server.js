const corsAnywhere = require('cors-anywhere');

const https = require('https');
const fs = require('fs');

// Load self-signed certificate and key (adjust paths if needed)
const options = {
    key: fs.readFileSync('C:/Users/STUDIOFIT50/SSL ceritificate/key.pem'),   // Path to your key.pem file
    cert: fs.readFileSync('C:/Users/STUDIOFIT50/SSL ceritificate/cert.pem')  // Path to your cert.pem file
};

const port = process.env.PORT || 8080;

corsAnywhere.createServer({
    originWhitelist: [], // Allow all origins
}).listen(port, () => {
    console.log(`CORS Anywhere HTTP proxy server running on port ${port}`);
});
