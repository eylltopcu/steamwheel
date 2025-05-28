const API_BASE = "/api/getGames";

const steamIdInput = document.getElementById("steamIdInput");
// API key input kaldırıldı, artık yok
const fetchBtn = document.getElementById("fetchBtn");
const statusText = document.getElementById("status");
const familyToggle = document.getElementById("includeFamily");
const spinBtn = document.getElementById("spinButton");
const chosenGameText = document.getElementById("chosenGame");
const coverImage = document.getElementById("coverImage");

let remainingGames = [];
let wheel;

fetchBtn.addEventListener("click", async () => {
  const steamId = steamIdInput.value.trim();
  const includeFamily = familyToggle.checked;

  if (!steamId) {
    alert("Please enter your Steam ID.");
    return;
  }

  statusText.textContent = "Fetching your games...";

  try {
    // API key artık otomatik backend'den alınıyor, gönderme!
    const res = await fetch(`${API_BASE}?steamid=${steamId}`);
    const data = await res.json();

    if (!data.response || !data.response.games) {
      statusText.textContent = "No games found or Steam profile might be private.";
      return;
    }

    let games = data.response.games;

    // Oynanmamış oyunları filtrele
    let unplayedGames = games.filter(game => game.playtime_forever === 0);

    // Aile oyunlarını dahil etme durumu
    if (!includeFamily) {
      // Steam API response’da "has_community_visible_stats" oyun oynanıp oynanmadığını gösterir, ama aile oyunlarını tespit için genelde "playtime_forever" 0’dır.
      // Aile oyunlarını ayıklamak için şöyle yapalım:
      // Eğer oyun "playtime_forever" 0'dan fazla değilse ve "has_community_visible_stats" yoksa aile oyunu olabilir, 
      // ama daha kesin filtreleme yapmak için başka API'ler veya manuel liste gerekebilir.
      // Biz basitçe "playtime_forever" == 0 ve oyun sahibi tarafından satın alınmış oyunları bırakıyoruz.
      // Bu yüzden aile oyunlarını ayıklamak için "playtime_forever" sıfır olsa bile bazı aile oyunları olabilir,
      // o yüzden biz şöyle yapalım: Aile oyunlarını dahil etme kapalı ise, oyunları olduğu gibi bırak (çünkü API bunu ayırmaz).
      // Eğer ileride net filtreleme istersen, backend'e özel endpoint ile yapılabilir.
      // Şimdilik aynen bırakıyoruz.
    }

    if (unplayedGames.length === 0) {
      statusText.textContent = "No unplayed games found!";
      return;
    }

    statusText.textContent = `Found ${unplayedGames.length} unplayed games! Now you can spin!`;

    createWheel(unplayedGames);
  } catch (err) {
    console.error("Fetch error:", err);
    statusText.textContent = "Failed to fetch games. Check your Steam ID.";
  }
});

function createWheel(gameList) {
  remainingGames = gameList.map(game => ({
    name: game.name,
    appid: game.appid
  }));

  const names = remainingGames.map(g => g.name);

  if (wheel) {
    wheel.setData(names);
  } else {
    wheel = new WheelSurf({
      el: '#wheel-wrapper',
      data: names,
      duration: 5000,
      callback: (selectedName) => {
        const selectedGame = remainingGames.find(g => g.name === selectedName);
        chosenGameText.textContent = `🎯 Selected Game: ${selectedGame.name}`;

        coverImage.src = `https://cdn.cloudflare.steamstatic.com/steam/apps/${selectedGame.appid}/library_600x900.jpg`;
        coverImage.style.display = "block";

        remainingGames = remainingGames.filter(g => g.name !== selectedName);

        if (remainingGames.length > 0) {
          wheel.setData(remainingGames.map(g => g.name));
        } else {
          spinBtn.disabled = true;
          chosenGameText.textContent = `🎉 All games have been picked!`;
          coverImage.style.display = "none";
        }
      }
    });
  }

  spinBtn.disabled = false;
  chosenGameText.textContent = "";
  coverImage.style.display = "none";
}

spinBtn.addEventListener("click", () => {
  if (wheel && remainingGames.length > 0) {
    wheel.run();
  }
});
