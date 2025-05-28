const API_BASE = "/api/getGames";

const steamIdInput = document.getElementById("steamId");
const fetchBtn = document.getElementById("fetchBtn");
const statusText = document.getElementById("chosenGame");
const familyToggle = document.getElementById("includeFamily");
const spinBtn = document.getElementById("spinButton");
const coverImage = document.getElementById("coverImage");
const wheelWrapper = document.getElementById("wheel-wrapper");

let remainingGames = [];
let wheel;

fetchBtn.addEventListener("click", async () => {
  const steamId = steamIdInput.value.trim();
  const includeFamily = !familyToggle.checked; // checkbox 'excludeFamily' olduğundan ters kullanalım

  if (!steamId) {
    alert("Lütfen Steam ID'nizi girin.");
    return;
  }

  statusText.textContent = "Oyunlar getiriliyor...";
  spinBtn.disabled = true;
  coverImage.style.display = "none";

  try {
    const res = await fetch(`${API_BASE}?steamid=${steamId}`);
    const data = await res.json();

    if (!data.response || !data.response.games) {
      statusText.textContent = "Oyun bulunamadı veya profil gizli olabilir.";
      return;
    }

    let games = data.response.games;

    // Oynanmamış oyunları filtrele
    let unplayedGames = games.filter(game => game.playtime_forever === 0);

    // Aile paylaşımlı oyunları çıkar (includeFamily false ise)
    if (!includeFamily) {
      unplayedGames = unplayedGames.filter(game => !game.has_community_visible_stats);
    }

    if (unplayedGames.length === 0) {
      statusText.textContent = "Oynanmamış oyun bulunamadı!";
      return;
    }

    statusText.textContent = `Toplam ${unplayedGames.length} oynanmamış oyun bulundu! Çarkı döndürebilirsiniz.`;

    createWheel(unplayedGames);
  } catch (err) {
    console.error("Fetch hatası:", err);
    statusText.textContent = "Oyunlar getirilirken hata oluştu. Steam ID'nizi kontrol edin.";
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
      el: "#wheel-wrapper",
      data: names,
      duration: 5000,
      callback: (selectedName) => {
        const selectedGame = remainingGames.find(g => g.name === selectedName);
        statusText.textContent = `🎯 Seçilen Oyun: ${selectedGame.name}`;

        coverImage.src = `https://cdn.cloudflare.steamstatic.com/steam/apps/${selectedGame.appid}/library_600x900.jpg`;
        coverImage.style.display = "block";

        remainingGames = remainingGames.filter(g => g.name !== selectedName);

        if (remainingGames.length > 0) {
          wheel.setData(remainingGames.map(g => g.name));
        } else {
          spinBtn.disabled = true;
          statusText.textContent = "🎉 Tüm oyunlar seçildi!";
          coverImage.style.display = "none";
        }
      }
    });
  }

  spinBtn.disabled = false;
  statusText.textContent = "";
  coverImage.style.display = "none";
}

spinBtn.addEventListener("click", () => {
  if (wheel && remainingGames.length > 0) {
    wheel.run();
  }
});
