/* ===== Firebase Imports ===== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* ===== Firebase Config ===== */
const firebaseConfig = {
  apiKey: "AIzaSyAjHSw-cDIn5Exn2zM7s2-l-_dNdwZiH6E",
  authDomain: "gemablusprice-a2663.firebaseapp.com",
  projectId: "gemablusprice-a2663",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ===== حفظ الاسم ===== */
window.saveName = async function () {
  const user = auth.currentUser;

  if (!user) {
    alert("سجل دخول الأول ❌");
    return;
  }

  const name = document.getElementById("nameInput").value.trim();

  if (!name) {
    alert("اكتب اسم ❌");
    return;
  }

  await setDoc(doc(db, "users", user.uid), {
    name: name
  }, { merge: true });

  document.getElementById("username").innerText = name;

  alert("✅ تم حفظ الاسم");
};

/* ===== تحميل البيانات ===== */
onAuthStateChanged(auth, async (user) => {

  if (!user) {
    alert("سجل الدخول أولاً ❌");
    window.location.href = "login.html";
    return;
  }

  // 📦 عناصر
  const usernameEl = document.getElementById("username");
  const emailEl = document.getElementById("email");
  const followersEl = document.getElementById("followers");
  const editBox = document.getElementById("editBox");
  const followBtn = document.getElementById("followBtn");

  // 👇 تحديد البروفايل
  const urlParams = new URLSearchParams(window.location.search);
  const profileId = urlParams.get("uid");

  const userIdToLoad = profileId || user.uid;

  // 🧠 هل بروفايلي؟
  const isMyProfile = user.uid === userIdToLoad;

  // 📧 الإيميل
  emailEl.innerText = isMyProfile ? user.email : "";

  // 👤 جلب البيانات
  const userRef = doc(db, "users", userIdToLoad);
  const snap = await getDoc(userRef);

  let followersCount = 0;

  if (snap.exists()) {
    const data = snap.data();
    usernameEl.innerText = data.name || "مستخدم";
    followersCount = data.followers || 0;
  } else {
    usernameEl.innerText = "مستخدم";
  }

  followersEl.innerText = followersCount;

  /* 🔥 التحكم في الواجهة */
  if (isMyProfile) {
    if (editBox) editBox.style.display = "block";
    if (followBtn) followBtn.style.display = "none";
  } else {
    if (editBox) editBox.style.display = "none";
    if (followBtn) followBtn.style.display = "block";

    // زر متابعة
    followBtn.onclick = async () => {
      await updateDoc(userRef, {
        followers: increment(1)
      });

      followersCount++;
      followersEl.innerText = followersCount;

      followBtn.innerText = "✔️ تمت";
      followBtn.disabled = true;
    };
  }

  // 📜 جلب القصائد
  const q = query(collection(db, "products"), where("uid", "==", userIdToLoad));
  const querySnapshot = await getDocs(q);

  let html = "";
  let count = 0;
  let totalLikes = 0;

  if (querySnapshot.empty) {
    html = `<p style="text-align:center;">لا توجد قصائد 😢</p>`;
  } else {
    querySnapshot.forEach(docItem => {
      const post = docItem.data();

      count++;
      totalLikes += post.likes || 0;

      html += `
        <div class="post">
          <h4>${post.price}</h4>
          <p>${post.name}</p>
        </div>
      `;
    });
  }

  document.getElementById("postCount").innerText = count;
  document.getElementById("totalLikes").innerText = totalLikes;
  document.getElementById("myPosts").innerHTML = html;
});

/* 🔙 رجوع */
window.goHome = function () {
  window.location.href = "index.html";
};