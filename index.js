require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const app = express();
// Heroku PORT’u yoksa 3001 kullan
const PORT = process.env.PORT || 3001;

app.use(cors());

app.get("/products", async (req, res) => {
  try {
    // Altın fiyatını al
    const goldApiResponse = await axios.get(
      "https://www.goldapi.io/api/XAU/USD",
      {
        headers: {
          "x-access-token": process.env.GOLD_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    const goldPrice = goldApiResponse.data.price_gram_24k; // USD per gram

    if (!goldPrice) {
      return res
        .status(500)
        .json({ error: "Gold price not available from API" });
    }

    // Ürünleri oku
    const rawData = fs.readFileSync(
      path.join(__dirname, "data", "products.json")
    );
    const products = JSON.parse(rawData);

    // Fiyat ve 5 üzerinden puan hesapla
    const updatedProducts = products.map((product) => {
      const price = (
        (product.popularityScore + 1) *
        product.weight *
        goldPrice
      ).toFixed(2);
      return {
        ...product,
        price: parseFloat(price),
        popularityScoreOutOf5: parseFloat(
          (product.popularityScore * 5).toFixed(1)
        ),
      };
    });

    res.json(updatedProducts);
  } catch (err) {
    console.error("Error fetching gold price or processing data:", err);
    res.status(500).json({ error: "Server error while fetching products" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend server is running on port ${PORT}`);
});
