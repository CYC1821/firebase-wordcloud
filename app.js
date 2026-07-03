import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const firebaseConfig = {
  projectId: "tools-lab-fa456",
  appId: "1:1023896454451:web:a921a83eeff77f51702a46",
  storageBucket: "tools-lab-fa456.firebasestorage.app",
  apiKey: "AIzaSyAvjXOAn91C8z_bRb7QFatmlEqFo58F2zs",
  authDomain: "tools-lab-fa456.firebaseapp.com",
  messagingSenderId: "1023896454451",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const records = collection(db, "demo_records");
const sessionId = "wordcloud-web";

const form = document.querySelector("#word-form");
const input = document.querySelector("#word-input");
const statusEl = document.querySelector("#status");
const cloudEl = document.querySelector("#word-cloud");
const recentList = document.querySelector("#recent-list");
const totalCount = document.querySelector("#total-count");
const uniqueCount = document.querySelector("#unique-count");
const topWord = document.querySelector("#top-word");
const clearButton = document.querySelector("#clear-button");

const colors = ["#176b5f", "#2f6690", "#b85c38", "#5b6f35", "#6f4e7c", "#3e606f"];
const angles = ["-5deg", "-3deg", "0deg", "2deg", "4deg"];

function normalizeWord(value) {
  return value.trim().replace(/\s+/g, " ").slice(0, 24);
}

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle("error", isError);
}

function formatTime(timestamp) {
  const date = timestamp?.toDate ? timestamp.toDate() : new Date();
  return date.toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderCloud(docs) {
  const counts = new Map();
  const recent = [];

  docs.forEach((snapshot) => {
    const data = snapshot.data();
    if (data.type !== "wordcloud" || !data.word) return;
    const key = String(data.word).trim();
    counts.set(key, (counts.get(key) || 0) + 1);
    recent.push({ id: snapshot.id, ...data });
  });

  recent.sort((a, b) => {
    const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return bTime - aTime;
  });

  const entries = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const max = entries[0]?.[1] || 1;

  totalCount.textContent = recent.length;
  uniqueCount.textContent = entries.length;
  topWord.textContent = entries[0] ? entries[0][0] : "-";

  if (!entries.length) {
    cloudEl.innerHTML = '<p class="empty">等待第一個關鍵字</p>';
  } else {
    cloudEl.innerHTML = "";
    entries.forEach(([word, count], index) => {
      const size = 1 + (count / max) * 2.4;
      const chip = document.createElement("span");
      chip.className = "word-chip";
      chip.textContent = word;
      chip.title = `${word}: ${count}`;
      chip.style.fontSize = `${size}rem`;
      chip.style.setProperty("--word-color", colors[index % colors.length]);
      chip.style.setProperty("--angle", angles[index % angles.length]);
      cloudEl.appendChild(chip);
    });
  }

  recentList.innerHTML = "";
  recent.slice(0, 8).forEach((item) => {
    const row = document.createElement("li");
    const word = document.createElement("strong");
    const time = document.createElement("time");
    word.textContent = item.word;
    time.textContent = formatTime(item.createdAt);
    row.append(word, time);
    recentList.appendChild(row);
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const word = normalizeWord(input.value);
  if (!word) return;

  form.querySelector("button").disabled = true;
  setStatus("寫入中");

  try {
    await addDoc(records, {
      type: "wordcloud",
      session: sessionId,
      word,
      normalized: word.toLocaleLowerCase("zh-TW"),
      createdAt: serverTimestamp(),
    });
    input.value = "";
    input.focus();
    setStatus("已連線");
  } catch (error) {
    console.error(error);
    setStatus("寫入失敗", true);
  } finally {
    form.querySelector("button").disabled = false;
  }
});

clearButton.addEventListener("click", async () => {
  clearButton.disabled = true;
  setStatus("清除中");

  try {
    const snapshot = await getDocs(query(records, where("session", "==", sessionId), limit(100)));
    await Promise.all(snapshot.docs.map((item) => deleteDoc(doc(db, "demo_records", item.id))));
    setStatus("已清除");
  } catch (error) {
    console.error(error);
    setStatus("清除失敗", true);
  } finally {
    clearButton.disabled = false;
  }
});

const liveQuery = query(records, where("session", "==", sessionId), limit(100));

onSnapshot(
  liveQuery,
  (snapshot) => {
    renderCloud(snapshot.docs);
    setStatus("已連線");
  },
  (error) => {
    console.error(error);
    setStatus("讀取失敗", true);
  },
);
