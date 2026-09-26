// 岁月津渡 · 本地视觉层。接口沿用原后端。
const appShell = document.querySelector(".app-shell");
const intro = document.getElementById("intro");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const stored = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
let motionEnabled = stored("du-motion") !== "off" && !reducedMotion.matches;
document.body.classList.toggle("motion-off", !motionEnabled);
let introTimer;
function showIntro() {
  if (!motionEnabled) { intro.classList.add("is-gone"); return; }
  clearTimeout(introTimer);
  intro.classList.add("is-gone");
  const moon = intro.querySelector(".intro-moon");
  moon.style.animation = "none";
  void moon.offsetWidth;
  moon.style.animation = "";
  intro.classList.remove("is-gone");
  introTimer = setTimeout(() => intro.classList.add("is-gone"), 2050);
}
try {
  if (sessionStorage.getItem("du-moonrise")) intro.classList.add("is-gone");
  else { showIntro(); sessionStorage.setItem("du-moonrise", "seen"); }
} catch { showIntro(); }

// Two small canvases only. Hidden pages and reduced-motion settings stop drawing.
function createWater(canvas, introMode = false) {
  const ctx = canvas?.getContext("2d");
  if (!ctx) return;
  let width = 1, height = 1, frame, lastTime = 0;
  function resize() {
    const r = canvas.getBoundingClientRect();
    width = Math.max(1,r.width); height = Math.max(1,r.height);
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = width * dpr; canvas.height = height * dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    render(0);
  }
  function render(t) {
    ctx.clearRect(0,0,width,height);
    const center = width * (introMode ? .5 : .76);
    for(let i=0;i<35;i++) {
      const p = i/35, y = p*p*height;
      const wave = Math.sin(i*2.37+t*.00035);
      const reach = (9+p*width*.13)*(0.5+0.5*Math.sin(i*4.2+t*.00028)**2);
      const x = center+wave*(5+p*width*.04)-reach/2;
      const g = ctx.createLinearGradient(x,0,x+reach,0);
      g.addColorStop(0,"#dddfcf00");g.addColorStop(.5,`rgba(226,227,212,${.08+(1-p)*.16})`);g.addColorStop(1,"#dddfcf00");
      ctx.fillStyle=g;ctx.fillRect(x,y,reach,.7+p*.8);
      if(i%3===0){ctx.strokeStyle="rgba(141,178,189,.09)";ctx.beginPath();ctx.ellipse(width*(.2+(i%7)*.11),y,width*(.06+p*.12),2,0,0,Math.PI);ctx.stroke();}
    }
  }
  function visible(){return !document.hidden && (introMode ? !intro.classList.contains("is-gone") : appShell.classList.contains("is-lobby"));}
  function tick(t){frame=null;if(motionEnabled && visible()){if(t-lastTime>33){render(t);lastTime=t;}frame=requestAnimationFrame(tick);}}
  function resume(){if(!frame && motionEnabled && visible()) frame=requestAnimationFrame(tick);}
  const observer=new ResizeObserver(resize);observer.observe(canvas);
  new MutationObserver(resume).observe(introMode ? intro : appShell,{attributes:true,attributeFilter:["class"]});
  document.addEventListener("visibilitychange",resume);
  document.addEventListener("du-motion",()=>{if(!motionEnabled){cancelAnimationFrame(frame);frame=null;render(0);}else resume();});
  resize();resume();
}
createWater(document.getElementById("introWaterCanvas"),true);
createWater(document.getElementById("lobbyWaterCanvas"));

document.addEventListener("pointerdown",event=>{
  const button=event.target.closest("button");
  if(!button || button.disabled || !motionEnabled)return;
  const rect=button.getBoundingClientRect(),ripple=document.createElement("span");
  ripple.className="tap-ripple";ripple.style.left=`${event.clientX-rect.left}px`;ripple.style.top=`${event.clientY-rect.top}px`;
  button.append(ripple);setTimeout(()=>ripple.remove(),900);
});
const settingsPanel=document.getElementById("settingsPanel"),optionsBtn=document.getElementById("optionsBtn"),motionToggle=document.getElementById("motionToggle");
optionsBtn.addEventListener("click",()=>{settingsPanel.hidden=!settingsPanel.hidden;optionsBtn.setAttribute("aria-expanded",String(!settingsPanel.hidden));});
document.addEventListener("keydown",event=>{if(event.key==="Escape"){settingsPanel.hidden=true;optionsBtn.setAttribute("aria-expanded","false");}});
document.addEventListener("click",event=>{if(!settingsPanel.contains(event.target)&&!optionsBtn.contains(event.target)){settingsPanel.hidden=true;optionsBtn.setAttribute("aria-expanded","false");}});
motionToggle.checked=motionEnabled;
motionToggle.addEventListener("change",()=>{
  motionEnabled=motionToggle.checked&&!reducedMotion.matches;
  motionToggle.checked=motionEnabled;
  document.body.classList.toggle("motion-off",!motionEnabled);
  if(!motionEnabled)intro.classList.add("is-gone");
  try{localStorage.setItem("du-motion",motionEnabled?"on":"off");}catch{}
  document.dispatchEvent(new Event("du-motion"));
});
reducedMotion.addEventListener("change",()=>{motionToggle.checked=!reducedMotion.matches;motionToggle.dispatchEvent(new Event("change"));});
document.getElementById("replayIntro").addEventListener("click",showIntro);
const chatTools=document.getElementById("chatTools"),chatToolsBtn=document.getElementById("chatToolsBtn");
chatToolsBtn.addEventListener("click",()=>{chatTools.hidden=!chatTools.hidden;chatToolsBtn.setAttribute("aria-expanded",String(!chatTools.hidden));});
document.querySelectorAll("[data-insert]").forEach(button=>button.addEventListener("click",()=>{
  const input=document.getElementById("chatInput");if(input.disabled)return;
  input.setRangeText(button.dataset.insert,input.selectionStart,input.selectionEnd,"end");input.dispatchEvent(new Event("input"));input.focus();
}));
// Avatar selection stays in this browser; no upload or account requirement.
for (const who of ["You","Du"]) {
  const input=document.getElementById(`avatar${who}`),preview=document.getElementById(`avatar${who}Preview`),key=`du-avatar-${who}`;
  function display(value){preview.style.backgroundImage=`url("${value}")`;preview.firstElementChild.hidden=true;}
  const saved=stored(key);if(saved?.startsWith("data:image/"))display(saved);
  input.addEventListener("change",()=>{
    const file=input.files[0];if(!file)return;
    const status=document.getElementById("playbackStatus");
    if(!file.type.startsWith("image/")||file.size>2*1024*1024){status.textContent="请选择 2 MB 以内的图片作为头像。";return;}
    const reader=new FileReader();reader.onload=()=>{display(reader.result);try{localStorage.setItem(key,reader.result);status.textContent="头像已保存在此浏览器。";}catch{status.textContent="头像已更换；浏览器空间不足，刷新后可能无法保留。";}};reader.readAsDataURL(file);
  });
}

// ======== 页面切换 ========
const tabs = document.querySelectorAll(".tab");
const pages = document.querySelectorAll(".page");

function openPage(pageName) {
  if (!["home", "chat", "music"].includes(pageName)) return;
  appShell?.classList.toggle("is-music", pageName === "music");
  document.querySelector('meta[name="theme-color"]').content = ({home:"#091b2a",chat:"#f4f5ef",music:"#e7dcda"})[pageName];
  settingsPanel.hidden = true;
  optionsBtn.setAttribute("aria-expanded", "false");
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
  if (matchMedia("(pointer: fine)").matches) window.setTimeout(() => chatInput?.focus({ preventScroll: true }), 120);
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
  const shouldHide = messageCount > 0;
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

let searchRequest = 0;
async function searchSong() {
  const keyword = musicSearch.value.trim();
  if (!keyword) return;
  const request = ++searchRequest;
  setSongStatus("正在替你找这首歌……");

  try {
    const response = await fetch(`/api/music/search?keyword=${encodeURIComponent(keyword)}`);
    const songs = await response.json();
    if (request !== searchRequest) return;
    if (!response.ok) throw new Error(songs.detail || "搜索失败");
    playlist = songs;
    currentIndex = -1;
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
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); playSong(index); }
      });
      songList.appendChild(item);
    });

    if (!songs.length) setSongStatus("没有找到，换个名字试试？");
  } catch (error) {
    if (request === searchRequest) setSongStatus("这会儿没找到歌，晚一点再试试。");
  }
}

let playRequest = 0;
async function playSong(index) {
  if (index < 0 || index >= playlist.length) return;
  const request = ++playRequest;
  audioEl.pause();
  audioEl.removeAttribute("src");
  audioEl.load();
  currentIndex = index;
  const song = playlist[index];
  playerName.textContent = song.name;
  playerArtist.textContent = song.artist;
  playerBar.classList.add("visible");
  document.getElementById("playbackStatus").textContent = "正在载入这首歌……";
  document.querySelectorAll(".song-item").forEach((item, i) => item.classList.toggle("is-current", i === index));
  try {
    const response = await fetch(`/api/music/url?id=${encodeURIComponent(song.id)}`);
    const data = await response.json();
    if (request !== playRequest) return;
    if (!response.ok || !data.url) throw new Error("没有播放地址");
    audioEl.src = data.url;
    await audioEl.play();
    if (request === playRequest) document.getElementById("playbackStatus").textContent = "";
  } catch (error) {
    if (request !== playRequest) return;
    document.getElementById("playbackStatus").textContent = "暂时无法播放这首歌，请重试或换一首。";
    syncPlayer();
  }
}

musicSearchBtn.addEventListener("click", searchSong);
musicSearch.addEventListener("keydown", (event) => {
  if (event.key === "Enter") searchSong();
});
playBtn.addEventListener("click", async () => {
  if (!audioEl.getAttribute("src")) {
    document.getElementById("playbackStatus").textContent = "先在下面搜索并选择一首歌。";
    musicSearch.focus();
    return;
  }
  try {
    if (audioEl.paused) await audioEl.play();
    else audioEl.pause();
  } catch {
    document.getElementById("playbackStatus").textContent = "播放未能开始，请再点一次播放。";
  }
});
prevBtn.addEventListener("click", () => playSong(currentIndex - 1));
nextBtn.addEventListener("click", () => playSong(currentIndex + 1));
audioEl.addEventListener("ended", () => {
  if (currentIndex < playlist.length - 1) playSong(currentIndex + 1);
  else syncPlayer();
});
function syncPlayer() {
  const playing = !audioEl.paused && !audioEl.ended;
  playBtn.textContent = playing ? "Ⅱ" : "▶";
  playBtn.setAttribute("aria-label", playing ? "暂停" : "播放");
  appShell.classList.toggle("is-playing", playing);
}
["play", "pause", "ended"].forEach(event => audioEl.addEventListener(event, syncPlayer));
audioEl.addEventListener("error", () => {
  document.getElementById("playbackStatus").textContent = "音频加载失败，请重新选歌。";
  syncPlayer();
});
const seekBar = document.getElementById("seekBar");
const clock = seconds => Number.isFinite(seconds) ? `${Math.floor(seconds / 60).toString().padStart(2,"0")}:${Math.floor(seconds % 60).toString().padStart(2,"0")}` : "00:00";
function syncProgress() {
  const duration = audioEl.duration;
  seekBar.disabled = !Number.isFinite(duration) || duration <= 0;
  seekBar.value = seekBar.disabled ? 0 : audioEl.currentTime / duration * 1000;
  document.getElementById("currentTime").textContent = clock(audioEl.currentTime);
  document.getElementById("duration").textContent = clock(duration);
}
["timeupdate", "durationchange", "loadedmetadata", "emptied"].forEach(event => audioEl.addEventListener(event, syncProgress));
seekBar.addEventListener("input", () => {
  if (Number.isFinite(audioEl.duration)) audioEl.currentTime = Number(seekBar.value) / 1000 * audioEl.duration;
});

// ======== PWA ========
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

loadHistory();
