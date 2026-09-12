// ======== Tab 切换 ========
const tabs = document.querySelectorAll(".tab");
const pages = document.querySelectorAll(".page");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    pages.forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.page).classList.add("active");
  });
});

// ======== 聊天 ========
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
let sending = false;

function addMessage(role, content) {
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.innerHTML = `<div class="msg-bubble">${escapeHtml(content)}</div>`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTyping() {
  const div = document.createElement("div");
  div.className = "msg assistant";
  div.id = "typingMsg";
  div.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTyping() {
  const el = document.getElementById("typingMsg");
  if (el) el.remove();
}

function escapeHtml(text) {
  const d = document.createElement("div");
  d.textContent = text;
  return d.innerHTML;
}

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text || sending) return;

  sending = true;
  sendBtn.disabled = true;
  chatInput.value = "";
  chatInput.style.height = "auto";

  addMessage("user", text);
  showTyping();

  try {
    const resp = await fetch("/api/chat/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    const data = await resp.json();
    removeTyping();
    if (resp.ok) {
      addMessage("assistant", data.reply);
    } else {
      addMessage("assistant", `[出错了] ${data.detail || "未知错误"}`);
    }
  } catch (e) {
    removeTyping();
    addMessage("assistant", "[网络错误，连不上渡的家]");
  }

  sending = false;
  sendBtn.disabled = false;
}

sendBtn.addEventListener("click", sendMessage);

chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

chatInput.addEventListener("input", () => {
  chatInput.style.height = "auto";
  chatInput.style.height = Math.min(chatInput.scrollHeight, 100) + "px";
});

async function loadHistory() {
  try {
    const resp = await fetch("/api/chat/history");
    const msgs = await resp.json();
    msgs.forEach((m) => addMessage(m.role, m.content));
  } catch (e) {}
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

async function searchSong() {
  const kw = musicSearch.value.trim();
  if (!kw) return;
  songList.innerHTML = "<li style='padding:16px;color:var(--text-dim)'>搜索中...</li>";

  try {
    const resp = await fetch(`/api/music/search?keyword=${encodeURIComponent(kw)}`);
    const songs = await resp.json();
    playlist = songs;
    songList.innerHTML = "";
    songs.forEach((s, i) => {
      const li = document.createElement("li");
      li.className = "song-item";
      li.innerHTML = `<div class="song-name">${escapeHtml(s.name)}</div>
        <div class="song-artist">${escapeHtml(s.artist)}</div>`;
      li.addEventListener("click", () => playSong(i));
      songList.appendChild(li);
    });
    if (!songs.length) {
      songList.innerHTML = "<li style='padding:16px;color:var(--text-dim)'>没有找到歌曲</li>";
    }
  } catch (e) {
    songList.innerHTML = "<li style='padding:16px;color:var(--text-dim)'>搜索失败</li>";
  }
}

async function playSong(index) {
  if (index < 0 || index >= playlist.length) return;
  currentIndex = index;
  const song = playlist[index];
  playerName.textContent = song.name;
  playerArtist.textContent = song.artist;
  playerBar.classList.add("visible");
  playBtn.textContent = "⏸";

  try {
    const resp = await fetch(`/api/music/url?id=${song.id}`);
    const data = await resp.json();
    if (data.url) {
      audioEl.src = data.url;
      audioEl.play();
    }
  } catch (e) {}
}

playBtn.addEventListener("click", () => {
  if (audioEl.paused) {
    audioEl.play();
    playBtn.textContent = "⏸";
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

musicSearchBtn.addEventListener("click", searchSong);
musicSearch.addEventListener("keydown", (e) => {
  if (e.key === "Enter") searchSong();
});

// ======== PWA ========
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/static/sw.js");
}

// ======== 初始化 ========
loadHistory();
