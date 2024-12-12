import { Analytics } from "@vercel/analytics/react";



const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

// Function to extract asset ID from a Roblox URL
const extractAssetIdFromUrl = (url) => {
  // Check if the URL is already just an ID
  if (/^\d+$/.test(url)) {
    return url; // Return the ID directly
  }

  // Otherwise, try to extract the ID from a URL
  const pattern = /roblox\.com\/catalog\/(\d+)/;
  const match = url.match(pattern);
  return match ? match[1] : null;
};


// Function to extract texture asset IDs using the modern regex pattern
const extractTextureIdsModern = (data) => {
  const pattern = /TextureId.*?rbxassetid:\/\/(\d+)/g;
  const matches = [];
  let match;
  while ((match = pattern.exec(data)) !== null) {
    matches.push(match[1]);
  }
  return matches;
};

// Function to extract texture asset IDs using the old fallback regex pattern
const extractTextureIdsOld = (data) => {
  const pattern = /TextureId.*?asset\/\?id=(\d+)/g;
  const matches = [];
  let match;
  while ((match = pattern.exec(data)) !== null) {
    matches.push(match[1]);
  }
  return matches;
};

// Function to get the texture image URL based on assetId
const fetchTextureImage = async (assetId) => {
  try {
    const assetUrl = `https://assetdelivery.roproxy.com/v1/asset?id=${assetId}`;
    const assetResponse = await axios.get(assetUrl);
    const assetData = JSON.stringify(assetResponse.data);

    let textureIds = extractTextureIdsModern(assetData);

    if (textureIds.length === 0) {
      textureIds = extractTextureIdsOld(assetData);
    }

    if (textureIds.length > 0) {
      const thumbnailUrl = `https://thumbnails.roproxy.com/v1/assets?assetIds=${textureIds[0]}&returnPolicy=PlaceHolder&size=420x420&format=webp`;
      const thumbnailResponse = await axios.get(thumbnailUrl);
      return thumbnailResponse.data.data[0].imageUrl;
    }
    return null;
  } catch (error) {
    console.error('Error fetching texture image:', error);
    return null;
  }
};

// Handle favicon request
app.get('/favicon.ico', (req, res) => {
  res.status(204).send();
});

// Endpoint to get texture image from a Roblox URL
app.get('/:url(*)', async (req, res) => {
  const { url } = req.params;
  const decodedUrl = decodeURIComponent(url); // Decode URL to handle encoded characters
  const assetId = extractAssetIdFromUrl(decodedUrl);

  if (!assetId) {
    return res.status(400).send('Invalid Roblox URL.');
  }

  const imageUrl = await fetchTextureImage(assetId);

  if (imageUrl) {
    res.redirect(imageUrl);
  } else {
    res.status(500).send('Error fetching texture image.');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
