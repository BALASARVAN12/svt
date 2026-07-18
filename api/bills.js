// api/bills.js
export default async function handler(req, res) {
  const apiKey = process.env.JSONBIN_API_KEY;
  const billsBinId = process.env.SHARED_BIN_ID;
  const inventoryBinId = process.env.INVENTORY_BIN_ID;
  const gstApiKey = process.env.GSTINCHECK_API_KEY; // Securely pulled from server environment

  // Route 1: Handle secure server-side GSTIN lookup requests
  if (req.query.gstin) {
    if (!gstApiKey) {
      return res.status(500).json({ error: "Server missing GST API configuration key." });
    }
    const targetGstin = req.query.gstin.trim().toUpperCase();
    try {
      const gstResponse = await fetch(`https://sheet.gstincheck.co.in/check/${gstApiKey}/${targetGstin}`);
      const gstData = await gstResponse.json();
      return res.status(200).json(gstData);
    } catch (error) {
      return res.status(500).json({ error: "Failed to query the live GST lookup service." });
    }
  }

  // Core configurations check for database operations
  if (!apiKey || !billsBinId || !inventoryBinId) {
    return res.status(500).json({ error: "Server configuration missing database keys." });
  }

  const isInventory = req.query.type === 'inventory';
  const targetBinId = isInventory ? inventoryBinId : billsBinId;

  // Route 2: Handle database fetches (GET)
  if (req.method === 'GET') {
    try {
      const response = await fetch(`https://api.jsonbin.io/v3/b/${targetBinId}/latest`, {
        method: "GET",
        headers: { "X-Master-Key": apiKey }
      });
      const data = await response.json();
      return res.status(200).json(data.record || []);
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch cloud records." });
    }
  }

  // Route 3: Handle database updates (PUT)
  if (req.method === 'PUT') {
    try {
      const response = await fetch(`https://api.jsonbin.io/v3/b/${targetBinId}`, {
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

  return res.status(405).json({ error: "Method not allowed" });
}