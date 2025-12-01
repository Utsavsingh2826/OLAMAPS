import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// Enable CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Debug logs
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  next();
});

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Call Autocomplete API with Referer and Origin headers
    // Get the origin from the request or default to localhost:3000
    const origin = req.headers.origin || req.headers.referer || 'http://localhost:3000';
    
    console.log(`[API] Making request to Ola Maps with origin: ${origin}`);
    console.log(`[API] API Key present: ${!!process.env.OLA_MAPS_API_KEY}`);
    
    const autocompleteResponse = await axios.get("https://api.olamaps.io/places/v1/autocomplete", {
      params: {
        input: message,
        api_key: process.env.OLA_MAPS_API_KEY
      },
      headers: {
        'Referer': origin,
        'Origin': origin,
        'User-Agent': req.headers['user-agent'] || 'OlaMaps-Client/1.0'
      }
    });

    // Add map URLs to each prediction
    const predictions = autocompleteResponse.data.predictions.map((prediction) => {
      const lat = prediction.geometry.location.lat;
      const lng = prediction.geometry.location.lng;
      
      // Generate static map URL
      const mapUrl = `https://api.olamaps.io/maps/v1/static?center=${lat},${lng}&zoom=15&size=400x300&api_key=${process.env.OLA_MAPS_API_KEY}`;
      
      return {
        ...prediction,
        map_url: mapUrl
      };
    });

    res.json({
      success: true,
      data: {
        ...autocompleteResponse.data,
        predictions: predictions
      }
    });

  } catch (err) {
    console.error("OLA MAPS ERROR:", err.response?.data || err.message);
    console.error("Error status:", err.response?.status);
    console.error("Error headers:", err.response?.headers);
    
    // Provide more helpful error message for domain restriction
    if (err.response?.data?.message?.includes('Domain') || err.response?.data?.message?.includes('not allowed')) {
      console.error("⚠️  Domain restriction error detected!");
      console.error("💡 Solution: Add your domain to the Ola Maps API key whitelist in the dashboard");
      console.error("💡 Or ensure the Referer/Origin header matches a whitelisted domain");
    }

    res.status(500).json({
      error: "Failed to fetch map data",
      details: err.response?.data || err.message,
      hint: err.response?.data?.message?.includes('Domain') 
        ? "Domain not whitelisted. Please add your domain to the Ola Maps API key settings."
        : undefined
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ detail: "Not Found" });
});

const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
