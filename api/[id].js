
import fetch from "node-fetch";

export default async function handler(req, res) {
  const { id } = req.query;

  // Validate the ID
  if (!id || isNaN(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  try {
    // Fetch asset data
    const assetResponse = await fetch(`https://assetdelivery.roblox.com/v1/asset?id=${id}`);
    const assetData = await assetResponse.text();

    // Extract TextureId
    const textureMatch = assetData.match(/TextureId   rbxassetid:\/\/(\d+)/);
    if (!textureMatch) {
      return res.status(404).json({ error: "TextureId not found" });
    }

    const textureId = textureMatch[1];

    // Fetch the thumbnail URL
    const thumbnailResponse = await fetch(
      `https://thumbnails.roblox.com/v1/assets?assetIds=${textureId}&returnPolicy=PlaceHolder&size=420x420&format=webp`
    );
    const thumbnailData = await thumbnailResponse.json();

    const thumbnail = thumbnailData.data[0];
    if (thumbnail.state !== "Completed") {
      return res.status(404).json({ error: "Thumbnail not ready" });
    }

    const imageUrl = thumbnail.imageUrl;

    // Respond with the embed-ready image URL
    return res.status(200).json({ imageUrl });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
