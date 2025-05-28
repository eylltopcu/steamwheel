const fetchButton = document.getElementById("fetchGames");
const wheelContainer = document.getElementById("wheelContainer");
const selectedGameText = document.getElementById("selectedGame");

let allUnplayedGames = [];
let remainingGames = [];

const API_KEY = "26A88DB657361DD206AF04FA64DDEE9B";

fetchButton.addEventListener("click", () => {
  const steamId = document.getElementById("steamId").value;
  const excludeFamily = document.getElementById("excludeFamily").checked;

  if (!steamId) {
    alert("Please enter your Steam ID.");
    return;
  }

  fetchUnplayedGames(steamId, excludeFamily);
});

async function fetchUnplayedGames(steamId, excludeFamily) {
  try {
    const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${API_KEY}&steamid=${steamId}&include_appinfo=true&include_played_free_games=true&format=json`;

    const res = await fetch(url);
    const data = await res.json();

    const unplayed = data.response.games.filter(game => game.playtime_forever === 0);

    let filtered = excludeFamily ? unplayed.filter(game => !isProbablyFamilyShared(game)) : unplayed;

    allUnplayedGames = filtered;
    remainingGames = [...allUnplayedGames];

    if (remainingGames.length === 0) {
      alert("No unplayed games found!");
      return;
    }

    alert(`Found ${remainingGames.length} unplayed games! Now you can spin!`);
    wheelContainer.classList.remove("hidden");

    // drawWheel() fonksiyonu birazdan eklenecek
  } catch (err) {
    console.error(err);
    alert("Failed to fetch games. Check your Steam ID and API key.");
  }
}

function isProbablyFamilyShared(game) {
  // Şimdilik sadece sahte bir kontrol. Daha sonra geliştirilebilir.
  return false;
}
