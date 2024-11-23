const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

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
    // Fetch asset delivery data
    const assetUrl = `https://assetdelivery.roblox.com/v1/asset?id=${assetId}`;
    const assetResponse = await axios.get(assetUrl);
    
    // Extract asset IDs from the response data
    const assetData = JSON.stringify(assetResponse.data); // Convert to string for regex matching
    
    // First attempt using the modern regex
    let textureIds = extractTextureIdsModern(assetData);
    
    // If no modern texture ID is found, use the fallback old regex
    if (textureIds.length === 0) {
      textureIds = extractTextureIdsOld(assetData);
    }

    // Attempt to fetch the thumbnail for the first extracted textureId
    if (textureIds.length > 0) {
      const thumbnailUrl = `https://thumbnails.roblox.com/v1/assets?assetIds=${textureIds[0]}&returnPolicy=PlaceHolder&size=420x420&format=webp`;
      const thumbnailResponse = await axios.get(thumbnailUrl);
      return thumbnailResponse.data.data[0].imageUrl; // Return the first image URL
    }
    
    // If no textureId found, return null
    return null;
  } catch (error) {
    console.error('Error fetching texture image:', error);
    return null;
  }
};

// Handle favicon request
app.get('/favicon.ico', (req, res) => {
  res.status(204).send(); // Respond with 204 No Content, as we're not serving a favicon here
});

// Endpoint to get texture image based on asset ID
app.get('/:assetId', async (req, res) => {
  const { assetId } = req.params;
  let imageUrl = await fetchTextureImage(assetId);

  if (imageUrl) {
    res.redirect(imageUrl); // Redirect to the texture image URL
  } else {
    // Try to grab the second texture ID from the error response data (if exists)
    try {
      const assetUrl = `https://assetdelivery.roblox.com/v1/asset?id=${assetId}`;
      const assetResponse = await axios.get(assetUrl);
      
      // Extract asset IDs from the response data
      const assetData = JSON.stringify(assetResponse.data); // Convert to string for regex matching
      
      // First attempt using the modern regex
      let textureIds = extractTextureIdsModern(assetData);
      
      // If no modern texture ID is found, use the fallback old regex
      if (textureIds.length === 0) {
        textureIds = extractTextureIdsOld(assetData);
      }

      if (textureIds.length > 1) {
        const secondAssetId = textureIds[1]; // Get the second textureId
        const thumbnailUrl = `https://thumbnails.roblox.com/v1/assets?assetIds=${secondAssetId}&returnPolicy=PlaceHolder&size=420x420&format=webp`;
        const thumbnailResponse = await axios.get(thumbnailUrl);
        res.redirect(thumbnailResponse.data.data[0].imageUrl); // Redirect to the second texture image URL
      } else {
        res.status(500).send('Error fetching texture image');
      }
    } catch (retryError) {
      console.error('Error fetching second texture image:', retryError);
      res.status(500).send('Error fetching texture image');
    }
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
