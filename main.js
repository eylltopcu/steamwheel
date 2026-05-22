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
const radius = 240;

let games = [];
let colors = [];
let segments = 0;

let startAngle = 0;
let isSpinning = false;
let spinTime = 0;
let spinTimeTotal = 0;

const translations = {
  tr: {
    title: 'Steam Game Picker <span style="font-size: 2.2rem; transform: translateY(-3px);">🎡</span>',
    steamIdPlaceholder: "Steam ID (Örn: 76561198...)",
    includeFamilyText: "Aile paylaşımlı oyunları dahil et",
    fetchGamesBtn: "Oyunları Getir",
    spinBtnLoading: "ÇARK YÜKLENİYOR",
    spinBtnReady: "ÇARKI DÖNDÜR",
    spinBtnAgain: "TEKRAR DÖNDÜR",
    spinBtnSpinning: "DÖNÜYOR...",
    statusInitial: "Lütfen Steam ID'nizi girerek oyunları çekin.",
    statusEmpty: "Henüz oyun yüklenmedi",
    statusFetching: "Oyunlar Steam'den çekiliyor...",
    statusNotFound: "Oyun bulunamadı veya profiliniz gizli.",
    statusNoUnplayed: "Hiç oynanmamış oyun bulunamadı!",
    statusFound: "Toplam {count} oynanmamış oyun bulundu!",
    statusError: "Oyunlar getirilirken hata oluştu.",
    statusSpinning: "Çark dönüyor, şansına ne çıkacak...",
    closePanelBtn: "TEŞEKKÜRLER, KAPAT",
    alertMissingId: "Lütfen Steam ID'nizi girin.",
    selectedPrefix: "🎯 "
  },
  en: {
    title: 'Steam Game Picker <span style="font-size: 2.2rem; transform: translateY(-3px);">🎡</span>',
    steamIdPlaceholder: "Steam ID (e.g. 76561198...)",
    includeFamilyText: "Include family shared games",
    fetchGamesBtn: "Fetch Games",
    spinBtnLoading: "WHEEL LOADING",
    spinBtnReady: "SPIN THE WHEEL",
    spinBtnAgain: "SPIN AGAIN",
    spinBtnSpinning: "SPINNING...",
    statusInitial: "Please enter your Steam ID to fetch games.",
    statusEmpty: "No games loaded yet",
    statusFetching: "Fetching games from Steam...",
    statusNotFound: "No games found or profile is private.",
    statusNoUnplayed: "No unplayed games found!",
    statusFound: "Found {count} unplayed games in total!",
    statusError: "Error occurred while fetching games.",
    statusSpinning: "Wheel is spinning, let's see what you get...",
    closePanelBtn: "THANKS, CLOSE",
    alertMissingId: "Please enter your Steam ID.",
    selectedPrefix: "🎯 "
  }
};

let currentLang = 'tr';

function setLanguage(lang) {
  currentLang = lang;
  document.getElementById("lang-tr").classList.toggle("active", lang === 'tr');
  document.getElementById("lang-en").classList.toggle("active", lang === 'en');
  
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if(translations[lang][key]) el.innerHTML = translations[lang][key];
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    if(translations[lang][key]) el.setAttribute("placeholder", translations[lang][key]);
  });
  
  if (games.length === 0) {
    drawEmptyWheel();
    statusText.textContent = translations[currentLang].statusInitial;
    spinBtn.textContent = translations[currentLang].spinBtnReady;
  } else if (!isSpinning) {
    statusText.textContent = translations[currentLang].statusFound.replace('{count}', games.length);
    spinBtn.textContent = translations[currentLang].spinBtnAgain;
  }
}

document.getElementById("lang-tr").addEventListener("click", () => setLanguage('tr'));
document.getElementById("lang-en").addEventListener("click", () => setLanguage('en'));


// Initialize
setLanguage('tr');


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
  ctx.fillText(translations[currentLang].statusEmpty, centerX, centerY);
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
    
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 4;

    let text = games[i].name;
    if(text.length > 22) text = text.substring(0, 20) + "...";

    ctx.fillText(text, radius - 20, 0);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
  ctx.fillStyle = "#1b2838";
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#66c0f4";
  ctx.stroke();

  ctx.fillStyle = "#ff4747";
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - radius + 10);
  ctx.lineTo(centerX + 15, centerY - radius - 25);
  ctx.lineTo(centerX - 15, centerY - radius - 25);
  ctx.closePath();
  ctx.fill();
  
  ctx.shadowBlur = 0;
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
  
  const normalizedStart = startAngle % (2 * Math.PI);
  const offset = (-Math.PI / 2) - normalizedStart;
  let normalizedOffset = offset % (2 * Math.PI);
  if (normalizedOffset < 0) normalizedOffset += 2 * Math.PI;
  
  const arcSize = (2 * Math.PI) / segments;
  const index = Math.floor(normalizedOffset / arcSize) % segments;
  
  const selectedGame = games[index];

  statusText.textContent = "";

  selectedGameName.textContent = translations[currentLang].selectedPrefix + selectedGame.name;
  selectedGameImage.src = `https://cdn.cloudflare.steamstatic.com/steam/apps/${selectedGame.appid}/library_600x900.jpg`;
  
  selectedGameImage.onerror = () => {
    selectedGameImage.src = `https://cdn.cloudflare.steamstatic.com/steam/apps/${selectedGame.appid}/header.jpg`;
  };

  selectedGamePanel.classList.add("active");
  spinBtn.disabled = false;
  spinBtn.textContent = translations[currentLang].spinBtnAgain;
}

closePanelBtn.addEventListener("click", () => {
  selectedGamePanel.classList.remove("active");
});

fetchBtn.addEventListener("click", async () => {
  const steamId = steamIdInput.value.trim();
  const includeFamily = familyToggle.checked;

  if (!steamId) {
    alert(translations[currentLang].alertMissingId);
    return;
  }

  statusText.textContent = translations[currentLang].statusFetching;
  spinBtn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}?steamid=${steamId}`);
    const data = await res.json();

    if (!data.response || !data.response.games) {
      statusText.textContent = translations[currentLang].statusNotFound;
      return;
    }

    let allGames = data.response.games;
    let unplayedGames = allGames.filter(game => game.playtime_forever === 0);

    if (!includeFamily) {
      unplayedGames = unplayedGames.filter(game => !game.has_community_visible_stats);
    }

    if (unplayedGames.length === 0) {
      statusText.textContent = translations[currentLang].statusNoUnplayed;
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

    statusText.textContent = translations[currentLang].statusFound.replace('{count}', games.length);
    spinBtn.disabled = false;

  } catch (err) {
    console.error("Fetch hatası:", err);
    statusText.textContent = translations[currentLang].statusError;
  }
});

spinBtn.addEventListener("click", () => {
  if (isSpinning || games.length === 0) return;
  spinTime = 0;
  spinTimeTotal = Math.floor(Math.random() * 3000) + 4000;
  isSpinning = true;
  spinBtn.disabled = true;
  spinBtn.textContent = translations[currentLang].spinBtnSpinning;
  statusText.textContent = translations[currentLang].statusSpinning;
  rotateWheel();
});