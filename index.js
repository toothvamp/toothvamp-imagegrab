const express = require('express');
const axios = require('axios');
const app = express();

// Function to extract texture asset IDs using regex pattern
const extractTextureIds = (data) => {
  const pattern = /TextureId.*?rbxassetid:\/\/(\d+)/g;
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
    // Fetch asset delivery data
    const assetUrl = `https://assetdelivery.roblox.com/v1/asset?id=${assetId}`;
    const assetResponse = await axios.get(assetUrl);
    
    // Extract asset IDs from the response data
    const assetData = JSON.stringify(assetResponse.data); // Convert to string for regex matching
    const textureIds = extractTextureIds(assetData); // Extract texture IDs using the regex pattern

    // Fetch the texture image URL for each extracted textureId
    for (const textureId of textureIds) {
      const thumbnailUrl = `https://thumbnails.roblox.com/v1/assets?assetIds=${textureId}&returnPolicy=PlaceHolder&size=420x420&format=webp`;
      const thumbnailResponse = await axios.get(thumbnailUrl);
      return thumbnailResponse.data.data[0].imageUrl; // Return the first image URL
    }
  } catch (error) {
    console.error('Error fetching texture image:', error);
    return null;
  }
};

// Endpoint to get texture image based on asset ID
app.get('/:assetId', async (req, res) => {
  const { assetId } = req.params;
  const imageUrl = await fetchTextureImage(assetId);

  if (imageUrl) {
    // Send the image as the response for Discord to embed
    res.set('Content-Type', 'image/webp'); // Set correct content type for the image
    res.redirect(imageUrl); // Discord will embed this image
  } else {
    res.status(500).send('Error fetching texture image');
  }
});

// Start the server
module.exports = app; // Export the app for deployment

