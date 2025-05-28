const API_BASE = "/api/getGames";

const steamIdInput = document.getElementById("steamId");
const fetchBtn = document.getElementById("fetchBtn");
const statusText = document.getElementById("chosenGame");
const familyToggle = document.getElementById("includeFamily");
const spinBtn = document.getElementById("spinButton");
const coverImage = document.getElementById("coverImage");

const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");

const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const radius = 200;

let games = [];
let colors = [];
let segments = 0;

let startAngle = 0;
let isSpinning = false;
let spinTime = 0;
let spinTimeTotal = 0;

function drawWheel() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for(let i = 0; i < segments; i++) {
    const angle = (2 * Math.PI / segments) * i + startAngle;
    const nextAngle = angle + 2 * Math.PI / segments;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, angle, nextAngle);
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle + (nextAngle - angle) / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px Arial";

    // Yazının çok uzun olmaması için kırpma
    let text = games[i].name;
    if(text.length > 20) text = text.substring(0, 17) + "...";

    ctx.fillText(text, radius - 10, 10);
    ctx.restore();
  }

  // Ok işareti
  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - radius - 20);
  ctx.lineTo(centerX - 15, centerY - radius + 20);
  ctx.lineTo(centerX + 15, centerY - radius + 20);
  ctx.closePath();
  ctx.fill();
}

function easeOut(t, b, c, d) {
  const ts = (t /= d) * t;
  const tc = ts * t;
  return b + c * (tc + -3 * ts + 3 * t);
}

function rotateWheel() {
  spinTime += 30;
  if (spinTime >= spinTimeTotal) {
    stopRotateWheel();
    return;
  }

  const spinAngle = easeOut(spinTime, 0, spinTimeTotal * 10, spinTimeTotal);
  startAngle += (spinAngle * Math.PI) / 180;
  drawWheel();
  requestAnimationFrame(rotateWheel);
}

function stopRotateWheel() {
  isSpinning = false;
  const degrees = (startAngle * 180) / Math.PI + 90;
  const arcd = 360 / segments;
  const index = Math.floor(((360 - (degrees % 360)) / arcd)) % segments;
  const selectedGame = games[index];

  statusText.textContent = `🎯 Seçilen Oyun: ${selectedGame.name}`;

  coverImage.src = `https://cdn.cloudflare.steamstatic.com/steam/apps/${selectedGame.appid}/library_600x900.jpg`;
  coverImage.style.display = "block";

  spinBtn.disabled = false;
}

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

    let allGames = data.response.games;

    // Oynanmamış oyunları filtrele
    let unplayedGames = allGames.filter(game => game.playtime_forever === 0);

    // Aile paylaşımlı oyunları çıkar (includeFamily false ise)
    if (!includeFamily) {
      unplayedGames = unplayedGames.filter(game => !game.has_community_visible_stats);
    }

    if (unplayedGames.length === 0) {
      statusText.textContent = "Oynanmamış oyun bulunamadı!";
      return;
    }

    // Oyunları güncelle
    games = unplayedGames.map(g => ({name: g.name, appid: g.appid}));

    // Renk paleti oluştur (çeşitli renkler)
    colors = [
      "#FF6384", "#36A2EB", "#FFCE56",
      "#66BB6A", "#BA68C8", "#FF7043",
      "#4DB6AC", "#9575CD", "#F06292",
      "#7986CB"
    ];

    segments = games.length;

    startAngle = 0;
    drawWheel();

    statusText.textContent = `Toplam ${games.length} oynanmamış oyun bulundu! Çarkı döndürebilirsiniz.`;
    spinBtn.disabled = false;

  } catch (err) {
    console.error("Fetch hatası:", err);
    statusText.textContent = "Oyunlar getirilirken hata oluştu. Steam ID'nizi kontrol edin.";
  }
});

spinBtn.addEventListener("click", () => {
  if (isSpinning || games.length === 0) return;
  spinTime = 0;
  spinTimeTotal = Math.floor(Math.random() * 3000) + 3000; // 3-6 saniye arasında dönecek
  isSpinning = true;
  spinBtn.disabled = true;
  statusText.textContent = "Dönüyor...";
  coverImage.style.display = "none";
  rotateWheel();
});
