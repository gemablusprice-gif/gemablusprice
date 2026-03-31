/* ===== Firebase Imports ===== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getFirestore, collection, addDoc, getDocs,
  doc, updateDoc, increment,
  query, where, deleteDoc,
  setDoc, getDoc,
  orderBy, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  getAuth, signInWithPopup, GoogleAuthProvider,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

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

/* ===== عناصر ===== */
let container, popup, userBox;
let selectedCategory = "الكل";

/* ===== تحميل الصفحة ===== */
window.addEventListener("DOMContentLoaded", async () => {

  container = document.querySelector(".container");
  popup = document.getElementById("popup");
  userBox = document.getElementById("userBox");

  loadItems();
  updateViews();

  /* ===== Online Users ===== */
  const userId = Date.now().toString();

  await setDoc(doc(db, "onlineUsers", userId), {
    time: Date.now()
  });

  window.addEventListener("beforeunload", async () => {
    await deleteDoc(doc(db, "onlineUsers", userId));
  });

  const onlineEl = document.getElementById("onlineCount");

  onSnapshot(collection(db, "onlineUsers"), (snapshot) => {

    if (onlineEl) {
      onlineEl.innerText = snapshot.size;
    }

    // تنظيف المستخدمين الغير نشطين
    const now = Date.now();

    snapshot.forEach(docSnap => {
      let data = docSnap.data();

      if (now - data.time > 30000) {
        deleteDoc(doc(db, "onlineUsers", docSnap.id));
      }
    });

  });

});

/* ===== حالة المستخدم ===== */
onAuthStateChanged(auth, (user) => {
  if (user) {
    userBox.innerText = "👤 " + user.displayName;
  } else {
    userBox.innerText = "غير مسجل";
  }
});

/* ===== تسجيل دخول ===== */
window.login = async function () {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, {
        name: user.displayName,
        uid: user.uid,
        createdAt: Date.now()
      });
    }

    alert("✅ تم تسجيل الدخول");
    loadItems();

  } catch (e) {
    alert(e.message);
    console.error(e);
  }
};

/* ===== popup ===== */
window.openAddPopup = () => popup.style.display = "flex";
window.closePopup = () => popup.style.display = "none";

/* ===== اختيار القسم ===== */
window.selectCategory = function (cat, el) {
  selectedCategory = cat;

  document.querySelectorAll(".cat-btn").forEach(btn => {
    btn.classList.remove("active");
  });

  el.classList.add("active");

  loadItems();
};

/* ===== حفظ ===== */
window.saveItem = async function () {
  try {
    let poem = document.getElementById("name").value.trim();
    let title = document.getElementById("price").value.trim();
    let category = document.getElementById("poemCategory").value || "عام";

    if (!auth.currentUser) {
      alert("سجل دخول الأول 🔐");
      return;
    }

    if (!poem || !title) {
      alert("اكتب البيانات ✍️");
      return;
    }

    await addDoc(collection(db, "products"), {
      name: poem,
      price: title,
      category,
      uid: auth.currentUser.uid,
      likes: 0,
      smiles: 0,
      createdAt: Date.now()
    });

    alert("✅ تم الحفظ");

    document.getElementById("name").value = "";
    document.getElementById("price").value = "";

    closePopup();
    loadItems();

  } catch (e) {
    alert(e.message);
  }
};

/* ===== أزرار ===== */
function createLikeButton(data, id) {
  let btn = document.createElement("button");
  btn.innerHTML = `❤️ ${data.likes || 0}`;

  btn.onclick = async () => {
    await updateDoc(doc(db, "products", id), {
      likes: increment(1)
    });
    data.likes++;
    btn.innerHTML = `❤️ ${data.likes}`;
  };

  return btn;
}

function createSmileButton(data, id) {
  let btn = document.createElement("button");
  btn.innerHTML = `😊 ${data.smiles || 0}`;

  btn.onclick = async () => {
    await updateDoc(doc(db, "products", id), {
      smiles: increment(1)
    });
    data.smiles++;
    btn.innerHTML = `😊 ${data.smiles}`;
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

  container.innerHTML = "⏳ جاري التحميل...";

  let q;

  if (selectedCategory === "الكل") {
    q = query(collection(db, "products"), orderBy("createdAt", "desc"));
  } else {
    q = query(
      collection(db, "products"),
      where("category", "==", selectedCategory),
      orderBy("createdAt", "desc")
    );
  }

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

/* ===== Views ===== */
async function updateViews() {
  try {
    const ref = doc(db, "stats", "visits");

    await updateDoc(ref, {
      count: increment(1)
    }).catch(async () => {
      await setDoc(ref, { count: 1 });
    });

    const snap = await getDoc(ref);

    const el = document.getElementById("viewsCount");
    if (el) el.innerText = snap.data().count;

  } catch (e) {
    console.log(e);
  }
}

/* ===== منشوراتي ===== */
window.myPosts = async function () {
  if (!auth.currentUser) {
    alert("سجل دخول الأول");
    return;
  }

  container.innerHTML = "";

  const snap = await getDocs(collection(db, "products"));

  snap.forEach(docSnap => {
    let data = docSnap.data();

    if (data.uid !== auth.currentUser.uid) return;

    let div = document.createElement("div");
    div.className = "item";

    div.innerHTML = `
      <h3>${data.price}</h3>
      <p>${data.name}</p>
    `;

    container.appendChild(div);
  });
};
