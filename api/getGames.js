import fetch from "node-fetch";

export default async function handler(req, res) {
  const { steamid } = req.query;
  const apiKey = process.env.STEAM_API_KEY;

  if (!steamid) {
    res.status(400).json({ error: "Missing steamid parameter" });
    return;
  }

  if (!apiKey) {
    res.status(500).json({ error: "API key not configured" });
    return;
  }

  try {
    const response = await fetch(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamid}&include_appinfo=true&include_played_free_games=true`);
    const data = await response.json();

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data from Steam API" });
  }
}
