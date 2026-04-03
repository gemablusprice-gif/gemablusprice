/* ===== Firebase Imports ===== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getFirestore, collection, addDoc, getDocs,
  doc, updateDoc, increment,
  query, deleteDoc,
  setDoc, getDoc,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  getAuth, signInWithPopup, GoogleAuthProvider,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  getDatabase, ref, set, onDisconnect, onValue
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

/* ===== Firebase Config ===== */
const firebaseConfig = {
  apiKey: "AIzaSyAjHSw-cDIn5Exn2zM7s2-l-_dNdwZiH6E",
  authDomain: "gemablusprice-a2663.firebaseapp.com",
  databaseURL: "https://gemablusprice-a2663-default-rtdb.firebaseio.com",
  projectId: "gemablusprice-a2663",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const dbRT = getDatabase(app);

/* ===== متغيرات ===== */
let container, popup, userBox;
let currentUser = null;

/* ===== تحميل الصفحة ===== */
window.addEventListener("DOMContentLoaded", () => {

  container = document.querySelector(".container");
  popup = document.getElementById("popup");
  userBox = document.getElementById("userBox");

  /* 🔍 البحث */
  const searchInput = document.getElementById("searchInput");
  const resultsBox = document.getElementById("searchResults");

  if (searchInput && resultsBox) {
    searchInput.addEventListener("input", async () => {

      const value = searchInput.value.toLowerCase().trim();

      if (!value) {
        resultsBox.innerHTML = "";
        return;
      }

      const snap = await getDocs(collection(db, "users"));

      let html = "";

      snap.forEach(docItem => {
        const user = docItem.data();

        if (user.name && user.name.toLowerCase().includes(value)) {
          html += `
            <div class="user-result" onclick="openProfile('${docItem.id}')">
              👤 ${user.name}
            </div>
          `;
        }
      });

      resultsBox.innerHTML = html || "<p>لا يوجد نتائج ❌</p>";
    });
  }

  loadItems();
  updateViews();
});

/* ===== حالة المستخدم ===== */
onAuthStateChanged(auth, (user) => {
  currentUser = user;

  if (userBox) {
    userBox.innerText = user
      ? "👤 " + (user.displayName || user.email)
      : "غير مسجل";
  }
});

/* ===== تسجيل دخول ===== */
window.login = async function () {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);

    if (!result.user) return alert("❌ فشل تسجيل الدخول");

    alert("✅ تم تسجيل الدخول");
    loadItems();

  } catch (e) {
    if (e.code !== "auth/popup-closed-by-user") {
      alert("❌ خطأ: " + e.message);
    }
  }
};
window.goProfile = function () {
  const user = auth.currentUser;

  if (!user) {
    alert("سجل دخول الأول ❌");
    return;
  }

  // 🔥 افتح بروفايلك
  window.location.href = "profile.html";
};

/* ===== Online System ===== */
const userId = Date.now().toString();
const userRef = ref(dbRT, "onlineUsers/" + userId);

set(userRef, true);
onDisconnect(userRef).remove();

onValue(ref(dbRT, "onlineUsers"), (snapshot) => {
  const data = snapshot.val();
  const count = data ? Object.keys(data).length : 0;

  const el = document.getElementById("onlineCount");
  if (el) el.innerText = count;
});

/* ===== Popup ===== */
window.openAddPopup = () => popup.style.display = "flex";
window.closePopup = () => popup.style.display = "none";

/* ===== نشر ===== */
window.saveItem = async function () {

  let poem = document.getElementById("name").value.trim();
  let title = document.getElementById("price").value.trim();
  let category = document.getElementById("poemCategory").value;

  if (!currentUser) return alert("⚠️ لازم تسجل دخول");
  if (!poem || !title) return alert("⚠️ اكتب البيانات");

  await addDoc(collection(db, "products"), {
    name: poem,
    price: title,
    category,
    uid: currentUser.uid,
    likes: 0,
    smiles: 0,
    createdAt: Date.now()
  });

  alert("✅ تم النشر");
  closePopup();
  loadItems();
};

/* ===== عرض ===== */
async function loadItems() {
  if (!container) return;

  const snap = await getDocs(query(collection(db, "products"), orderBy("likes", "desc")));
  container.innerHTML = "";

  snap.forEach(docSnap => {
    let data = docSnap.data();
    let id = docSnap.id;

    let div = document.createElement("div");
    div.className = "item";

    div.innerHTML = `
      <a href="poem.html?id=${id}">
        <h3>${data.price}</h3>
        <p>${data.name.substring(0, 120)}...</p>
      </a>
    `;

    container.appendChild(div);
  });
}

/* ===== زيارات ===== */
async function updateViews() {
  const refDoc = doc(db, "stats", "visits");

  await updateDoc(refDoc, { count: increment(1) }).catch(async () => {
    await setDoc(refDoc, { count: 1 });
  });

  const snap = await getDoc(refDoc);
  const el = document.getElementById("viewsCount");
  if (el) el.innerText = snap.data().count;
}

/* 🔗 فتح بروفايل */
window.openProfile = function(uid) {
  window.location.href = "profile.html?uid=" + uid;
};
