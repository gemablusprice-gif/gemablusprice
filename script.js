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
let container;
let popup;
let userBox;

/* ===== الحالة ===== */
let selectedCategory = "الكل";

/* ===== تحميل الصفحة ===== */
window.addEventListener("DOMContentLoaded", () => {
  container = document.querySelector(".container");
  popup = document.getElementById("popup");
  userBox = document.getElementById("userBox");

  loadItems();
  updateViews();
});

/* ===== متابعة حالة المستخدم ===== */
onAuthStateChanged(auth, (user) => {
  if (user) {
    if (userBox) userBox.innerText = "👤 " + user.displayName;
  } else {
    if (userBox) userBox.innerText = "غير مسجل";
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

/* ===== حفظ القصيدة ===== */
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
      alert("اكتب القصيدة والعنوان ✍️");
      return;
    }

    await addDoc(collection(db, "products"), {
      name: poem,
      price: title,
      category: category,
      uid: auth.currentUser.uid,
      likes: 0,
      smiles: 0,
      createdAt: Date.now() // 🔥 مهم للترتيب
    });

    alert("✅ تم حفظ القصيدة");

    document.getElementById("name").value = "";
    document.getElementById("price").value = "";

    closePopup();
    loadItems();

  } catch (e) {
    alert(e.message);
  }
};

/* ===== أزرار التفاعل ===== */
function createLikeButton(data, id) {
  let btn = document.createElement("button");
  btn.className = "like-btn";
  btn.innerHTML = `❤️ ${data.likes || 0}`;

  btn.onclick = async () => {
    await updateDoc(doc(db, "products", id), {
      likes: increment(1)
    });

    data.likes = (data.likes || 0) + 1;
    btn.innerHTML = `❤️ ${data.likes}`;
  };

  return btn;
}

function createSmileButton(data, id) {
  let btn = document.createElement("button");
  btn.className = "smile-btn";
  btn.innerHTML = `😊 ${data.smiles || 0}`;

  btn.onclick = async () => {
    await updateDoc(doc(db, "products", id), {
      smiles: increment(1)
    });

    data.smiles = (data.smiles || 0) + 1;
    btn.innerHTML = `😊 ${data.smiles}`;
  };

  return btn;
}

/* ===== حذف ===== */
window.deleteItem = async function (id) {
  let ok = confirm("متأكد تحذف؟ 🗑");
  if (!ok) return;

  await deleteDoc(doc(db, "products", id));
  loadItems();
};

/* ===== عرض القصائد ===== */
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

    // 🔥 كارت قابل للضغط
    div.innerHTML = `
      <a href="poem.html?id=${id}">
        <h3>${data.price}</h3>
        <small style="color:#94a3b8">${data.category}</small>
        <p>${data.name.substring(0, 120)}...</p>
      </a>
    `;

    let actions = document.createElement("div");
    actions.className = "actions-row";

    actions.append(
      createLikeButton(data, id),
      createSmileButton(data, id)
    );

    // 🔐 حذف لصاحب المنشور فقط
    if (auth.currentUser && auth.currentUser.uid === data.uid) {
      let del = document.createElement("button");
      del.className = "btn delete-btn";
      del.innerText = "🗑 حذف";
      del.onclick = () => deleteItem(id);
      actions.append(del);
    }

    div.appendChild(actions);
    container.appendChild(div);
  });
}

  const snap = await getDocs(q);

  container.innerHTML = "";

  snap.forEach(docSnap => {
    let data = docSnap.data();
    let id = docSnap.id;

    let div = document.createElement("div");
    div.className = "item";

    div.innerHTML = `
      <h3>${data.price}</h3>
      <small style="color:#94a3b8">${data.category}</small>
      <p>${data.name}</p>
    `;

    let actions = document.createElement("div");
    actions.className = "actions-row";

    actions.append(
      createLikeButton(data, id),
      createSmileButton(data, id)
    );

    if (auth.currentUser && auth.currentUser.uid === data.uid) {
      let del = document.createElement("button");
      del.className = "btn";
      del.innerText = "🗑 حذف";
      del.onclick = () => deleteItem(id);
      actions.append(del);
    }

    div.appendChild(actions);
    container.appendChild(div);
  });

/* ===== عداد الزيارات ===== */
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
    if (el) {
      el.innerText = snap.data().count;
    }

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

  const snap = await getDocs(collection(db, "products"));}
/*foreach sna[محمد فواد حسن احمد سعد لو حصلت حاله طاره]*/
snap.forEach(docSnap => {
  let data = docSnap.data();
  let id = docSnap.id;

  let div = document.createElement("div");
  div.className = "item";

  div.innerHTML = `
    <h3>${data.price}</h3>
    <p>${data.name}</p>
  `;

  let actions = document.createElement("div");
  actions.className = "actions-row";

  // أزرار عادية
  actions.innerHTML = `
    <button class="like-btn">❤️ ${data.likes || 0}</button>
    <button class="smile-btn">😊 ${data.smiles || 0}</button>
  `;

  // 🔥 زر الحذف يظهر فقط لصاحب المنشور
  if (auth.currentUser && data.uid === auth.currentUser.uid) {
    let delBtn = document.createElement("button");
    delBtn.innerText = "🗑 حذف";
    delBtn.className = "btn";
    delBtn.onclick = () => deleteItem(id);

    actions.appendChild(delBtn);
  }

  div.appendChild(actions);
  container.appendChild(div);
});
