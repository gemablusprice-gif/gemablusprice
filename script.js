/* ===== Firebase Imports ===== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getFirestore, collection, addDoc, getDocs,
  doc, updateDoc, increment,
  query, where, deleteDoc,
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

/* ===== 🔥 Online System (Realtime) ===== */
const dbRT = getDatabase(app);

const userId = Date.now().toString();
const userRef = ref(dbRT, "onlineUsers/" + userId);

// دخول
set(userRef, true);

// خروج
onDisconnect(userRef).remove();

// قراءة العدد
const countRef = ref(dbRT, "onlineUsers");

onValue(countRef, (snapshot) => {
  const data = snapshot.val();
  const count = data ? Object.keys(data).length : 0;

  const el = document.getElementById("onlineCount");
  if (el) el.innerText = count;
});

/* ===== عناصر DOM ===== */
let container, popup, userBox;
let selectedCategory = "الكل";

/* ===== تحميل الصفحة ===== */
window.addEventListener("DOMContentLoaded", () => {
  container = document.querySelector(".container");
  popup = document.getElementById("popup");
  userBox = document.getElementById("userBox");

  loadItems();
  updateViews();
});

/* ===== حالة المستخدم ===== */
onAuthStateChanged(auth, (user) => {
  if (user) userBox.innerText = "👤 " + user.displayName;
  else userBox.innerText = "غير مسجل";
});

/* ===== تسجيل دخول ===== */
window.login = async function () {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  alert("✅ تم تسجيل الدخول");
};

/* ===== حفظ ===== */
window.saveItem = async function () {
  let poem = document.getElementById("name").value.trim();
  let title = document.getElementById("price").value.trim();

  if (!poem || !title) return alert("اكتب البيانات");

  await addDoc(collection(db, "products"), {
    name: poem,
    price: title,
    createdAt: Date.now(),
    likes: 0
  });

  loadItems();
};

/* ===== عرض ===== */
async function loadItems() {
  if (!container) return;

  const snap = await getDocs(collection(db, "products"));
  container.innerHTML = "";

  snap.forEach(docSnap => {
    let data = docSnap.data();

    let div = document.createElement("div");
    div.className = "item";

    div.innerHTML = `
      <h3>${data.price}</h3>
      <p>${data.name}</p>
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
  document.getElementById("viewsCount").innerText = snap.data().count;
}
