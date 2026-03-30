import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getFirestore, collection, getDocs, query, where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* Firebase */
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

/* تحميل رسائل الشوق */
async function loadMissing() {

  const container = document.getElementById("container");

  container.innerHTML = "⏳ جاري التحميل...";

  const q = query(
    collection(db, "products"),
    where("category", "==", "شوق")
  );

  const snap = await getDocs(q);

  container.innerHTML = "";

  snap.forEach(docSnap => {

    const data = docSnap.data();

    const div = document.createElement("div");
    div.className = "item";

    div.innerHTML = `
      <a href="poem.html?id=${docSnap.id}">
        <h3>${data.price}</h3>
        <p>${data.name.substring(0,100)}...</p>
      </a>
    `;

    container.appendChild(div);

  });

}

loadMissing();