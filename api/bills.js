// api/bills.js
export default async function handler(req, res) {
  // Grab the hidden keys from Vercel's secure environment
  const apiKey = process.env.JSONBIN_API_KEY;
  const binId = process.env.SHARED_BIN_ID;

  if (!apiKey || !binId) {
    return res.status(500).json({ error: "Server configuration missing keys." });
  }

  // Handle Dashboard Sync (GET request)
  if (req.method === 'GET') {
    try {
      const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
        method: "GET",
        headers: { "X-Master-Key": apiKey }
      });
      const data = await response.json();
      return res.status(200).json(data.record || []);
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch bills from cloud repository." });
    }
  }

  // Handle Save/Update/Delete (PUT request)
  if (req.method === 'PUT') {
    try {
      const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Master-Key": apiKey
        },
        body: JSON.stringify(req.body)
      });
      
      if (response.ok) {
        return res.status(200).json({ success: true });
      } else {
        return res.status(500).json({ error: "Failed to update cloud database." });
      }
    } catch (error) {
      return res.status(500).json({ error: "Server communication error." });
    }
  }

  return res.status(45).json({ error: "Method not allowed" });
}