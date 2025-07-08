require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const app = express();

// Heroku’nun verdiği PORT’u al, yoksa 3001 kullan
const PORT = process.env.PORT || 3001;

app.use(cors());

app.get("/products", async (req, res) => {
  try {
    // GoldAPI’dan gerçek zamanlı gram fiyatı çekiyoruz
    const goldApiResponse = await axios.get(
      "https://www.goldapi.io/api/XAU/USD",
      {
        headers: {
          "x-access-token": process.env.GOLD_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    const goldPrice = goldApiResponse.data.price_gram_24k; // USD/gram

    if (!goldPrice) {
      return res.status(500).json({ error: "Gold price not available" });
    }

    // products.json dosyasını oku
    const raw = fs.readFileSync(path.join(__dirname, "data", "products.json"));
    const products = JSON.parse(raw);

    // Her ürünün fiyatını ve 5’lik popülerlik derecesini hesapla
    const updated = products.map((p) => {
      const price = ((p.popularityScore + 1) * p.weight * goldPrice).toFixed(2);
      return {
        ...p,
        price: parseFloat(price),
        popularityScoreOutOf5: parseFloat((p.popularityScore * 5).toFixed(1)),
      };
    });

    res.json(updated);
  } catch (err) {
    console.error("Error fetching products:", err.response?.data || err);
    res.status(500).json({ error: "Server error while fetching products" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend listening on port ${PORT}`);
});
