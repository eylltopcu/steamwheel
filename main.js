const API_BASE = "/api/getGames";

const steamIdInput = document.getElementById("steamId");
const fetchBtn = document.getElementById("fetchBtn");
const statusText = document.getElementById("chosenGame");
const familyToggle = document.getElementById("includeFamily");
const spinBtn = document.getElementById("spinButton");
const coverImage = document.getElementById("coverImage");

let remainingGames = [];
let theWheel;

fetchBtn.addEventListener("click", async () => {
  const steamId = steamIdInput.value.trim();
  const includeFamily = !familyToggle.checked;

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

    let unplayedGames = games.filter(game => game.playtime_forever === 0);

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

  // Winwheel için dilimler
  const segments = remainingGames.map(g => ({
    fillStyle: getRandomColor(),
    text: g.name
  }));

  // Eğer önceden çark varsa sil
  if (theWheel) {
    theWheel.stopAnimation(false);
    theWheel.rotationAngle = 0;
    theWheel.segments = [];
    theWheel.clearCanvas();
  }

  theWheel = new Winwheel({
    canvasId: 'canvas',
    numSegments: segments.length,
    segments: segments,
    animation: {
      type: 'spinToStop',
      duration: 5,
      spins: 8,
      callbackFinished: (indicatedSegment) => {
        const selectedName = indicatedSegment.text;
        const selectedGame = remainingGames.find(g => g.name === selectedName);

        statusText.textContent = `🎯 Seçilen Oyun: ${selectedGame.name}`;
        coverImage.src = `https://cdn.cloudflare.steamstatic.com/steam/apps/${selectedGame.appid}/library_600x900.jpg`;
        coverImage.style.display = "block";

        // Seçilen oyunu çıkar
        remainingGames = remainingGames.filter(g => g.name !== selectedName);

        if (remainingGames.length > 0) {
          createWheel(remainingGames);
        } else {
          spinBtn.disabled = true;
          statusText.textContent = "🎉 Tüm oyunlar seçildi!";
          coverImage.style.display = "none";
        }
      }
    }
  });

  spinBtn.disabled = false;
  statusText.textContent = "";
  coverImage.style.display = "none";
}

spinBtn.addEventListener("click", () => {
  if (theWheel && remainingGames.length > 0) {
    theWheel.startAnimation();
  }
});

// Rastgele renk fonksiyonu
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for(let i=0; i<6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
