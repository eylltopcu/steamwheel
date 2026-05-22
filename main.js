const API_BASE = "/api/getGames";

const steamIdInput = document.getElementById("steamId");
const fetchBtn = document.getElementById("fetchBtn");
const statusText = document.getElementById("chosenGame");
const familyToggle = document.getElementById("includeFamily");
const spinBtn = document.getElementById("spinButton");
const selectedGamePanel = document.getElementById("selectedGamePanel");
const selectedGameName = document.getElementById("selectedGameName");
const selectedGameImage = document.getElementById("selectedGameImage");
const closePanelBtn = document.getElementById("closePanelBtn");

const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");

const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const radius = 240; // increased radius for larger wheel feeling

let games = [];
let colors = [];
let segments = 0;

let startAngle = 0;
let isSpinning = false;
let spinTime = 0;
let spinTimeTotal = 0;

// Initialize an empty wheel
drawEmptyWheel();
spinBtn.textContent = "ÇARKI DÖNDÜR";

function drawEmptyWheel() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(102, 192, 244, 0.3)";
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.font = "bold 20px Inter";
  ctx.fillText("Henüz oyun yüklenmedi", centerX, centerY);
}

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
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.stroke();

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle + (nextAngle - angle) / 2);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px Inter";
    
    // Shadow for text readability
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 4;

    let text = games[i].name;
    if(text.length > 22) text = text.substring(0, 20) + "...";

    ctx.fillText(text, radius - 20, 0);
    ctx.restore();
  }

  // Draw Center Circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
  ctx.fillStyle = "#1b2838";
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#66c0f4";
  ctx.stroke();

  // Draw sleek pointer
  ctx.fillStyle = "#ff4747";
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - radius + 10);
  ctx.lineTo(centerX + 15, centerY - radius - 25);
  ctx.lineTo(centerX - 15, centerY - radius - 25);
  ctx.closePath();
  ctx.fill();
  
  ctx.shadowBlur = 0; // reset
}

function easeOut(t, b, c, d) {
  t /= d;
  t--;
  return c * (t*t*t + 1) + b;
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
  
  // Normalize start angle
  const normalizedStart = startAngle % (2 * Math.PI);
  
  // The pointer is at the top: angle = -PI/2 (or 3PI/2).
  // When the wheel rotates by normalizedStart, the segment that falls under the pointer is shifted.
  // The correct calculation for finding the selected segment:
  const offset = (-Math.PI / 2) - normalizedStart;
  let normalizedOffset = offset % (2 * Math.PI);
  if (normalizedOffset < 0) normalizedOffset += 2 * Math.PI;
  
  const arcSize = (2 * Math.PI) / segments;
  const index = Math.floor(normalizedOffset / arcSize) % segments;
  
  const selectedGame = games[index];

  statusText.textContent = "";

  selectedGameName.textContent = `🎯 ${selectedGame.name}`;
  selectedGameImage.src = `https://cdn.cloudflare.steamstatic.com/steam/apps/${selectedGame.appid}/library_600x900.jpg`;
  
  // On error loading image, fallback
  selectedGameImage.onerror = () => {
    selectedGameImage.src = `https://cdn.cloudflare.steamstatic.com/steam/apps/${selectedGame.appid}/header.jpg`;
  };

  selectedGamePanel.classList.add("active");
  spinBtn.disabled = false;
  spinBtn.textContent = "TEKRAR DÖNDÜR";
}

closePanelBtn.addEventListener("click", () => {
  selectedGamePanel.classList.remove("active");
});

fetchBtn.addEventListener("click", async () => {
  const steamId = steamIdInput.value.trim();
  const includeFamily = familyToggle.checked;

  if (!steamId) {
    alert("Lütfen Steam ID'nizi girin.");
    return;
  }

  statusText.textContent = "Oyunlar Steam'den çekiliyor...";
  spinBtn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}?steamid=${steamId}`);
    const data = await res.json();

    if (!data.response || !data.response.games) {
      statusText.textContent = "Oyun bulunamadı veya profiliniz gizli.";
      return;
    }

    let allGames = data.response.games;
    let unplayedGames = allGames.filter(game => game.playtime_forever === 0);

    if (!includeFamily) {
      unplayedGames = unplayedGames.filter(game => !game.has_community_visible_stats);
    }

    if (unplayedGames.length === 0) {
      statusText.textContent = "Hiç oynanmamış oyun bulunamadı!";
      return;
    }

    games = unplayedGames.map(g => ({name: g.name, appid: g.appid}));

    colors = [
      "#FF6384", "#36A2EB", "#FFCE56",
      "#66BB6A", "#BA68C8", "#FF7043",
      "#4DB6AC", "#9575CD", "#F06292",
      "#7986CB"
    ];

    segments = games.length;
    startAngle = 0;
    drawWheel();

    statusText.textContent = `Toplam ${games.length} oynanmamış oyun bulundu!`;
    spinBtn.disabled = false;

  } catch (err) {
    console.error("Fetch hatası:", err);
    statusText.textContent = "Oyunlar getirilirken hata oluştu.";
  }
});

spinBtn.addEventListener("click", () => {
  if (isSpinning || games.length === 0) return;
  spinTime = 0;
  spinTimeTotal = Math.floor(Math.random() * 3000) + 4000; // 4-7 saniye arası
  isSpinning = true;
  spinBtn.disabled = true;
  spinBtn.textContent = "DÖNÜYOR...";
  statusText.textContent = "Çark dönüyor, şansına ne çıkacak...";
  rotateWheel();
});