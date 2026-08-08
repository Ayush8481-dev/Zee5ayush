export default async function handler(req, res) {
  // 1. Ensure CORS is allowed (Optional but good for testing)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. Extract the target URL safely
  // We use req.url and substring so that '&' in the Zee5 URL doesn't break the query parameters
  const urlIndex = req.url.indexOf('url=');
  if (urlIndex === -1) {
    return res.status(400).json({ error: "Missing 'url' parameter. Usage: /api/data?url=YOUR_LINK" });
  }

  let targetUrl = req.url.substring(urlIndex + 4);
  
  // If you URL-encoded the link (which you should), decode it safely
  if (targetUrl.startsWith('http%3A') || targetUrl.startsWith('https%3A')) {
    targetUrl = decodeURIComponent(targetUrl);
  }

  try {
    // 3. Make the internal POST request to Zee5
    const fetchResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        "referer": "https://www.zee5.com/",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "accept": "application/json",
        "content-type": "application/json",
        "cookie": "variant=v2",
        // Note: Do not add :authority, :method, etc. Fetch handles this internally.
      },
      // Because your original request had a content-length of 1027, it means a JSON payload was sent.
      // Since you're calling this via a GET request, we send an empty object.
      // If the API requires the actual body, it might return status 475.
      body: JSON.stringify({}) 
    });

    // 4. Safely parse the response (Handling both JSON and Text)
    const responseText = await fetchResponse.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      // If the response isn't JSON, just return the raw text
      responseData = responseText;
    }

    // 5. Send the exact Status Code (e.g., 475, 200) and the Data back to you
    return res.status(fetchResponse.status).json({
      status: fetchResponse.status,
      source: "Vercel Proxy",
      data: responseData
    });

  } catch (error) {
    console.error("Fetch Error:", error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
}
