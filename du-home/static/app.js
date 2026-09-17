const intro = document.getElementById("intro");
window.setTimeout(() => intro?.classList.add("is-gone"), 3100);

// 原创的程序化夜海：波纹会分割月光，形成不规则、缓慢聚散的反射。
// 不依赖图片或视频，离线安装成 PWA 后仍然可以动。
function createMoonSea(canvas, { compact = false, harbor = false } = {}) {
  if (!canvas) return null;
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return null;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let frame = 0;
  const ripples = [];

  function resize() {
    const rect = canvas.getBoundingClientRect();
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  function waveOffset(x, y, time, layer) {
    return (
      Math.sin(x * (0.018 + layer * 0.0009) + time * (0.00038 + layer * 0.000015) + layer * 1.7) * (0.7 + y * 0.006) +
      Math.sin(x * 0.041 - time * 0.00024 + layer * 0.83) * (0.34 + y * 0.0025) +
      Math.sin(x * 0.007 + time * 0.00015) * 0.55
    );
  }

  function seededNoise(seed) {
    const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return value - Math.floor(value);
  }

  function draw(time = 0) {
    context.clearRect(0, 0, width, height);

    const sea = context.createLinearGradient(0, 0, 0, height);
    sea.addColorStop(0, harbor ? "rgba(46,61,119,.44)" : compact ? "rgba(29,42,73,.30)" : "rgba(19,32,60,.28)");
    sea.addColorStop(0.24, harbor ? "rgba(30,48,104,.82)" : compact ? "rgba(15,25,48,.72)" : "rgba(12,24,48,.69)");
    sea.addColorStop(0.66, harbor ? "rgba(19,34,81,.93)" : compact ? "rgba(9,17,35,.88)" : "rgba(8,18,38,.88)");
    sea.addColorStop(1, harbor ? "rgba(6,12,33,.99)" : compact ? "rgba(5,10,23,.96)" : "rgba(4,10,22,.96)");
    context.fillStyle = sea;
    context.fillRect(0, 0, width, height);

    const layers = harbor ? 46 : compact ? 17 : 30;
    for (let layer = 0; layer < layers; layer += 1) {
      const progress = layer / Math.max(1, layers - 1);
      const y = 2 + Math.pow(progress, 1.58) * (height - 3);

      if (harbor) {
        const segments = 2 + Math.round(progress * 4);
        for (let segmentIndex = 0; segmentIndex < segments; segmentIndex += 1) {
          const startNoise = seededNoise(layer * 8.3 + segmentIndex * 17.1);
          const lengthNoise = seededNoise(layer * 13.7 + segmentIndex * 5.9);
          const span = width * (.09 + lengthNoise * .13) * (.64 + progress * .78);
          const startX = ((segmentIndex + startNoise * .74) / segments) * width - span * .28;
          const endX = Math.min(width + 12, startX + span);
          const crest = context.createLinearGradient(startX, 0, endX, 0);
          const alpha = .065 + progress * .105;
          crest.addColorStop(0, "rgba(119,148,211,0)");
          crest.addColorStop(.18, `rgba(${120 + Math.round(progress * 42)},${149 + Math.round(progress * 43)},${211 + Math.round(progress * 29)},${alpha * .52})`);
          crest.addColorStop(.48, `rgba(${126 + Math.round(progress * 47)},${157 + Math.round(progress * 47)},${218 + Math.round(progress * 27)},${alpha})`);
          crest.addColorStop(.82, `rgba(${116 + Math.round(progress * 38)},${145 + Math.round(progress * 40)},${207 + Math.round(progress * 27)},${alpha * .5})`);
          crest.addColorStop(1, "rgba(119,148,211,0)");

          context.beginPath();
          for (let x = startX; x <= endX; x += 3) {
            const offset = waveOffset(x, y, time, layer) + Math.sin(x * .025 + segmentIndex * 2.4) * .36;
            if (x === startX) context.moveTo(x, y + offset);
            else context.lineTo(x, y + offset);
          }
          context.strokeStyle = crest;
          context.lineWidth = .62 + progress * .9;
          context.stroke();
        }
        continue;
      }

      context.beginPath();
      for (let x = -6; x <= width + 6; x += compact ? 3 : 5) {
        const offset = waveOffset(x, y, time, layer);
        if (x === -6) context.moveTo(x, y + offset);
        else context.lineTo(x, y + offset);
      }
      context.strokeStyle = `rgba(${104 + Math.round(progress * 32)}, ${126 + Math.round(progress * 30)}, ${174 + Math.round(progress * 30)}, ${0.065 + progress * 0.055})`;
      context.lineWidth = 0.55 + progress * 0.55;
      context.stroke();
    }

    // 大厅水面额外叠一层散落碎光：近处略长、远处短，避免整齐的横线感。
    if (harbor) {
      context.save();
      context.globalCompositeOperation = "screen";
      context.shadowColor = "rgba(205,218,248,.22)";
      context.shadowBlur = 2.2;
      for (let glint = 0; glint < 46; glint += 1) {
        const verticalNoise = seededNoise(glint + 3.4);
        const horizontalNoise = seededNoise(glint + 41.8);
        const sizeNoise = seededNoise(glint + 83.2);
        const depth = Math.pow(verticalNoise, .72);
        const y = height * (.08 + depth * .88);
        const drift = Math.sin(time * .00016 + glint * 1.43) * (2 + depth * 5);
        const x = horizontalNoise * width + drift;
        const glintWidth = 7 + sizeNoise * (13 + depth * 25);
        const pulse = .52 + .48 * Math.sin(time * .00055 + glint * 2.1);
        const light = context.createLinearGradient(x - glintWidth / 2, 0, x + glintWidth / 2, 0);
        light.addColorStop(0, "rgba(201,214,246,0)");
        light.addColorStop(.38, `rgba(211,223,250,${.045 + depth * .075 + pulse * .045})`);
        light.addColorStop(.58, `rgba(249,244,226,${.075 + depth * .12 + pulse * .07})`);
        light.addColorStop(1, "rgba(201,214,246,0)");
        context.fillStyle = light;
        context.fillRect(x - glintWidth / 2, y + waveOffset(x, y, time, glint) * .28, glintWidth, .65 + depth * 1.05);
      }
      context.restore();
    }

    const reflectionX = compact ? width * 0.5 : width * 0.78;
    const strips = harbor ? 44 : compact ? 18 : 34;
    context.save();
    context.globalCompositeOperation = "screen";
    for (let strip = 0; strip < strips; strip += 1) {
      const progress = strip / Math.max(1, strips - 1);
      const y = 2 + Math.pow(progress, 1.42) * (height - 4);
      const reach = (compact ? width * 0.1 : width * 0.045) + progress * (compact ? width * 0.3 : width * 0.18);
      const drift = Math.sin(time * 0.00024 + strip * 1.91) * reach * 0.26;
      const fracture = 0.34 + 0.46 * (0.5 + 0.5 * Math.sin(strip * 2.37 + time * 0.00051));
      const segment = Math.max(3, reach * fracture);
      const x = reflectionX + drift - segment / 2;
      const shimmer = 0.5 + 0.5 * Math.sin(time * 0.0007 + strip * 1.17);

      const light = context.createLinearGradient(x, 0, x + segment, 0);
      light.addColorStop(0, "rgba(190,199,226,0)");
      light.addColorStop(0.3, `rgba(204,211,236,${(harbor ? .13 : .07) + shimmer * (harbor ? .15 : .09)})`);
      light.addColorStop(0.55, `rgba(245,241,229,${(harbor ? .23 : .13) + shimmer * (harbor ? .2 : .13)})`);
      light.addColorStop(1, "rgba(190,199,226,0)");
      context.fillStyle = light;
      context.fillRect(x, y + waveOffset(x, y, time, strip) * 0.45, segment, compact ? 1.15 : (harbor ? 1.05 : .8) + progress * (harbor ? 1.55 : 1.25));

      if (strip % 4 === 0) {
        context.fillStyle = `rgba(179,191,226,${0.025 + shimmer * 0.04})`;
        context.fillRect(reflectionX - reach * 0.78, y + 2, reach * 1.56, 0.6);
      }
    }
    context.restore();

    for (let index = ripples.length - 1; index >= 0; index -= 1) {
      const ripple = ripples[index];
      const age = Math.max(0, (time - ripple.startedAt) / 900);
      if (age >= 1) {
        ripples.splice(index, 1);
        continue;
      }

      const eased = 1 - Math.pow(1 - age, 3);
      const radius = 8 + eased * Math.max(width * .19, 76);
      context.save();
      context.globalCompositeOperation = "screen";
      for (let ring = 0; ring < 3; ring += 1) {
        const ringAge = Math.max(0, age - ring * .11);
        if (!ringAge) continue;
        const ringRadius = radius * (1 - ring * .14);
        context.beginPath();
        context.ellipse(ripple.x, ripple.y, ringRadius, ringRadius * .16, 0, 0, Math.PI * 2);
        context.strokeStyle = `rgba(210,218,239,${(1 - ringAge) * (.23 - ring * .045)})`;
        context.lineWidth = 1.1 - ring * .2;
        context.stroke();
      }
      context.restore();
    }

    if (!reducedMotion.matches) frame = window.requestAnimationFrame(draw);
  }

  resize();
  draw(performance.now());
  const resizeObserver = new ResizeObserver(() => {
    resize();
    if (reducedMotion.matches) draw(performance.now());
  });
  resizeObserver.observe(canvas);

  return {
    ripple(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      ripples.push({
        x: Math.max(0, Math.min(width, clientX - rect.left)),
        y: Math.max(4, Math.min(height - 4, clientY - rect.top)),
        startedAt: performance.now(),
      });
      if (reducedMotion.matches) draw(performance.now());
    },
    destroy() {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
    },
  };
}

createMoonSea(document.getElementById("seaCanvas"));
createMoonSea(document.getElementById("introWaterCanvas"), { compact: true });
const lobbySea = createMoonSea(document.getElementById("lobbyWaterCanvas"), { harbor: true });
createMoonSea(document.getElementById("bottomWaterCanvas"), { compact: true });

const appShell = document.querySelector(".app-shell");
appShell?.addEventListener("pointerdown", (event) => {
  if (!appShell.classList.contains("is-lobby")) return;
  lobbySea?.ripple(event.clientX, event.clientY);
});

// 所有交互键共享一圈很轻的水面涟漪。
document.addEventListener("pointerdown", (event) => {
  const button = event.target.closest("button");
  if (!button || button.disabled) return;
  const rect = button.getBoundingClientRect();
  const ripple = document.createElement("span");
  ripple.className = "tap-ripple";
  ripple.style.left = `${event.clientX - rect.left}px`;
  ripple.style.top = `${event.clientY - rect.top}px`;
  button.appendChild(ripple);
  ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
});

// ======== 页面切换 ========
const tabs = document.querySelectorAll(".tab");
const pages = document.querySelectorAll(".page");

function openPage(pageName) {
  appShell?.classList.toggle("is-lobby", pageName === "home");
  appShell?.classList.toggle("is-chat", pageName === "chat");
  tabs.forEach((item) => {
    const selected = item.dataset.page === pageName;
    item.classList.toggle("active", selected);
    if (selected) item.setAttribute("aria-current", "page");
    else item.removeAttribute("aria-current");
  });
  pages.forEach((page) => page.classList.toggle("active", page.id === pageName));
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const destination = tab.dataset.page;
    openPage(destination);
    if (destination === "chat") enterChat();
  });
});

document.querySelectorAll(".star-entry").forEach((entry) => {
  entry.addEventListener("click", () => {
    const destination = entry.dataset.destination;
    openPage(destination);
    if (destination === "chat") enterChat();
  });
});

document.getElementById("homeBtn")?.addEventListener("click", () => openPage("home"));

// ======== 聊天 ========
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const chatEmptyPlaceholder = document.getElementById("chatEmptyPlaceholder");
let sending = false;

function enterChat() {
  window.setTimeout(() => chatInput?.focus({ preventScroll: true }), 120);
}

function scrollChat() {
  window.requestAnimationFrame(() => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}

function formatMessageTime(value) {
  if (value === false) return "";
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function beginsAssistantGroup() {
  let previous = chatMessages.lastElementChild;
  while (previous?.classList.contains("thinking-row")) previous = previous.previousElementSibling;
  return !previous?.classList.contains("assistant");
}

function updateChatEmptyState() {
  const messageCount = chatMessages.querySelectorAll(".msg:not(.thinking-row)").length;
  const shouldHide = messageCount >= 3;
  chatEmptyPlaceholder?.classList.toggle("is-hidden", shouldHide);
  chatEmptyPlaceholder?.setAttribute("aria-hidden", String(shouldHide));
}

function addMessage(role, content, timestamp) {
  const row = document.createElement("article");
  row.className = `msg ${role}`;
  if (role === "assistant" && beginsAssistantGroup()) {
    row.classList.add("has-avatar");
    const avatar = document.createElement("span");
    avatar.className = "du-avatar";
    avatar.setAttribute("aria-hidden", "true");
    row.appendChild(avatar);
  }

  const label = document.createElement("span");
  label.className = "msg-label";
  const name = document.createElement("span");
  name.textContent = role === "user" ? "岁岁" : "渡";
  label.appendChild(name);
  const time = formatMessageTime(timestamp);
  if (time) {
    const clock = document.createElement("time");
    clock.className = "msg-time";
    clock.textContent = time;
    label.appendChild(clock);
  }

  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";
  bubble.textContent = content;

  row.append(label, bubble);
  chatMessages.appendChild(row);
  updateChatEmptyState();
  scrollChat();
}

function addThinking(content, { loading = false, open = false } = {}) {
  const row = document.createElement("article");
  row.className = "msg assistant thinking-row";
  if (loading) row.id = "thinkingMsg";

  const details = document.createElement("details");
  details.className = `thinking-card${loading ? " is-loading" : ""}`;
  details.open = open;

  const summary = document.createElement("summary");
  const orbit = document.createElement("span");
  orbit.className = "thought-orbit";
  const title = document.createElement("span");
  title.textContent = loading ? "渡在想……" : "渡刚才想了这些";
  summary.append(orbit, title);

  const body = document.createElement("div");
  body.className = "thinking-body";
  if (loading) {
    const loader = document.createElement("div");
    loader.className = "tide-loader";
    loader.setAttribute("aria-label", "正在等待回复");
    body.appendChild(loader);
  } else {
    body.textContent = content;
  }

  details.append(summary, body);
  row.appendChild(details);
  chatMessages.appendChild(row);
  scrollChat();
}

function removeThinkingLoader() {
  document.getElementById("thinkingMsg")?.remove();
}

function setSending(value) {
  sending = value;
  sendBtn.disabled = value;
  chatInput.disabled = value;
  if (!value) chatInput.focus({ preventScroll: true });
}

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text || sending) return;

  setSending(true);
  chatInput.value = "";
  chatInput.style.height = "auto";
  addMessage("user", text);
  addThinking("", { loading: true, open: true });

  try {
    const response = await fetch("/api/chat/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    const data = await response.json();
    removeThinkingLoader();

    if (response.ok) {
      // 渡总后端提供 thinking / reasoning 字段后，前端会自动呈现。
      const thinking = data.thinking || data.reasoning || "";
      if (thinking.trim()) addThinking(thinking.trim());
      addMessage("assistant", data.reply);
    } else {
      addMessage("assistant", `这阵潮水没能抵达。${data.detail ? `\n${data.detail}` : ""}`);
    }
  } catch (error) {
    removeThinkingLoader();
    addMessage("assistant", "暂时连不上渡的家。等潮水缓一缓，再试一次。");
  } finally {
    setSending(false);
  }
}

sendBtn.addEventListener("click", sendMessage);
chatInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    sendMessage();
  }
});
chatInput.addEventListener("input", () => {
  chatInput.style.height = "auto";
  chatInput.style.height = `${Math.min(chatInput.scrollHeight, 112)}px`;
});

async function loadHistory() {
  try {
    const response = await fetch("/api/chat/history");
    if (!response.ok) return;
    const messages = await response.json();
    messages.forEach((message) => addMessage(
      message.role,
      message.content,
      message.timestamp ?? message.created_at ?? message.createdAt ?? false,
    ));
  } catch (error) {
    // 首次本地预览或离线时，保留安静的空状态。
  }
}

// ======== 音乐 ========
const musicSearch = document.getElementById("musicSearch");
const musicSearchBtn = document.getElementById("musicSearchBtn");
const songList = document.getElementById("songList");
const audioEl = document.getElementById("audioEl");
const playerBar = document.getElementById("playerBar");
const playBtn = document.getElementById("playBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const playerName = document.getElementById("playerName");
const playerArtist = document.getElementById("playerArtist");

let playlist = [];
let currentIndex = -1;

function setSongStatus(message) {
  songList.replaceChildren();
  const item = document.createElement("li");
  item.className = "music-status";
  item.textContent = message;
  songList.appendChild(item);
}

async function searchSong() {
  const keyword = musicSearch.value.trim();
  if (!keyword) return;
  setSongStatus("正在替你找这首歌……");

  try {
    const response = await fetch(`/api/music/search?keyword=${encodeURIComponent(keyword)}`);
    const songs = await response.json();
    if (!response.ok) throw new Error(songs.detail || "搜索失败");
    playlist = songs;
    songList.replaceChildren();

    songs.forEach((song, index) => {
      const item = document.createElement("li");
      item.className = "song-item";
      item.tabIndex = 0;
      const name = document.createElement("div");
      name.className = "song-name";
      name.textContent = song.name;
      const artist = document.createElement("div");
      artist.className = "song-artist";
      artist.textContent = song.artist;
      item.append(name, artist);
      item.addEventListener("click", () => playSong(index));
      item.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") playSong(index);
      });
      songList.appendChild(item);
    });

    if (!songs.length) setSongStatus("没有找到，换个名字试试？");
  } catch (error) {
    setSongStatus("这会儿没找到歌，晚一点再试试。");
  }
}

async function playSong(index) {
  if (index < 0 || index >= playlist.length) return;
  currentIndex = index;
  const song = playlist[index];
  playerName.textContent = song.name;
  playerArtist.textContent = song.artist;
  playerBar.classList.add("visible");
  playBtn.textContent = "Ⅱ";

  try {
    const response = await fetch(`/api/music/url?id=${song.id}`);
    const data = await response.json();
    if (!response.ok || !data.url) throw new Error("没有播放地址");
    audioEl.src = data.url;
    await audioEl.play();
  } catch (error) {
    playBtn.textContent = "▶";
  }
}

musicSearchBtn.addEventListener("click", searchSong);
musicSearch.addEventListener("keydown", (event) => {
  if (event.key === "Enter") searchSong();
});
playBtn.addEventListener("click", async () => {
  if (!audioEl.src) return;
  if (audioEl.paused) {
    await audioEl.play();
    playBtn.textContent = "Ⅱ";
  } else {
    audioEl.pause();
    playBtn.textContent = "▶";
  }
});
prevBtn.addEventListener("click", () => playSong(currentIndex - 1));
nextBtn.addEventListener("click", () => playSong(currentIndex + 1));
audioEl.addEventListener("ended", () => {
  if (currentIndex < playlist.length - 1) playSong(currentIndex + 1);
  else playBtn.textContent = "▶";
});

// ======== PWA ========
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/static/sw.js");
}

loadHistory();
