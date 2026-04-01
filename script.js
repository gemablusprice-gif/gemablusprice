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

/* 🔥 Realtime */
import {
  getDatabase, ref, set, onDisconnect, onValue
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

/* ===== Firebase Config ===== */
const firebaseConfig = {
  apiKey: "AIzaSyAjHSw-cDIn5Exn2zM7s2-l-_dNdwZiH6E",
  authDomain: "gemablusprice-a2663.firebaseapp.com",
  databaseURL: "https://gemablusprice-a2663-default-rtdb.firebaseio.com",
  projectId: "gemablusprice-a2663",
  storageBucket: "gemablusprice-a2663.firebasestorage.app",
  messagingSenderId: "922754795410",
  appId: "1:922754795410:web:4c4f3e73e4ac4c9008a34b",
  measurementId: "G-86PJQG21C1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const dbRT = getDatabase(app);

/* ===== عناصر DOM ===== */
let container, popup, userBox;
let selectedCategory = "الكل";

/* ===== 🔥 Online System ===== */
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
  userBox.innerText = user ? "👤 " + user.displayName : "غير مسجل";
});

/* ===== تسجيل دخول ===== */
window.login = async function () {
  try {
    const provider = new GoogleAuthProvider();

    // 🔥 مهم: خليه ينتظر فعلاً
    const result = await signInWithPopup(auth, provider);

    if (!result.user) {
      alert("❌ فشل تسجيل الدخول");
      return;
    }

    alert("✅ تم تسجيل الدخول");

    loadItems(); // تحديث البيانات بعد الدخول

  } catch (e) {
    console.log(e);

    // 🔥 منع الوميض أو الإغلاق المفاجئ
    if (e.code === "auth/popup-closed-by-user") return;

    alert("❌ خطأ: " + e.message);
  }
};

/* ===== popup ===== */
window.openAddPopup = () => popup.style.display = "flex";
window.closePopup = () => popup.style.display = "none";

/* ===== حفظ ===== */
window.saveItem = async function () {
  let poem = document.getElementById("name").value.trim();
  let title = document.getElementById("price").value.trim();
  let category = document.getElementById("poemCategory").value;

  if (!auth.currentUser) return alert("سجل دخول الأول");
  if (!poem || !title) return alert("اكتب البيانات");

  await addDoc(collection(db, "products"), {
    name: poem,
    price: title,
    category,
    uid: auth.currentUser.uid,
    likes: 0,
    smiles: 0,
    createdAt: Date.now()
  });

  closePopup();
  loadItems();
};

/* ===== Like ===== */
function createLikeButton(data, id) {
  let btn = document.createElement("button");
  btn.classList.add("like-btn");

  const liked = JSON.parse(localStorage.getItem("liked") || "[]");
  let isLiked = liked.includes(id);

  btn.innerHTML = `❤️ ${data.likes || 0}`;
  if (isLiked) btn.disabled = true;

  btn.onclick = async () => {
    if (isLiked) return;

    try {
      await updateDoc(doc(db, "products", id), {
        likes: increment(1)
      });

      data.likes++;
      btn.innerHTML = `❤️ ${data.likes}`;
      btn.disabled = true;

      liked.push(id);
      localStorage.setItem("liked", JSON.stringify(liked));
    } catch (e) {
      alert("خطأ في اللايك ❌");
      console.log(e);
    }
  };

  return btn;
}

/* ===== Smile ===== */
function createSmileButton(data, id) {
  let btn = document.createElement("button");
  btn.classList.add("smile-btn");

  const smiled = JSON.parse(localStorage.getItem("smiled") || "[]");
  let isSmiled = smiled.includes(id);

  btn.innerHTML = `😊 ${data.smiles || 0}`;
  if (isSmiled) btn.disabled = true;

  btn.onclick = async () => {
    if (isSmiled) return;

    try {
      await updateDoc(doc(db, "products", id), {
        smiles: increment(1)
      });

      data.smiles++;
      btn.innerHTML = `😊 ${data.smiles}`;
      btn.disabled = true;

      smiled.push(id);
      localStorage.setItem("smiled", JSON.stringify(smiled));
    } catch (e) {
      alert("خطأ في السمايل ❌");
      console.log(e);
    }
  };

  return btn;
}

/* ===== حذف ===== */
window.deleteItem = async function (id) {
  if (!confirm("متأكد؟")) return;
  await deleteDoc(doc(db, "products", id));
  loadItems();
};

/* ===== عرض ===== */
async function loadItems() {
  if (!container) return;

  const q = query(collection(db, "products"), orderBy("likes", "desc"));
  const snap = await getDocs(q);

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

    let actions = document.createElement("div");
    actions.className = "actions";

    actions.append(
      createLikeButton(data, id),
      createSmileButton(data, id)
    );

    if (auth.currentUser && auth.currentUser.uid === data.uid) {
      let del = document.createElement("button");
      del.innerText = "🗑 حذف";
      del.onclick = () => deleteItem(id);
      actions.append(del);
    }

    div.appendChild(actions);
    container.appendChild(div);
  });
}

/* ===== زيارات ===== */
async function updateViews() {
  const ref = doc(db, "stats", "visits");

  await updateDoc(ref, { count: increment(1) }).catch(async () => {
    await setDoc(ref, { count: 1 });
  });

  const snap = await getDoc(ref);
  document.getElementById("viewsCount").innerText = snap.data().count;
}
