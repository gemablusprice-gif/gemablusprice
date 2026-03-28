import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getFirestore, collection, addDoc, getDocs,
  doc, updateDoc, increment,
  query, where, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  getAuth, signInWithPopup, GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

/* Firebase */
const firebaseConfig = {
  apiKey: "AIzaSyAjHSw-cDIn5Exn2zM7s2-l-_dNdwZiH6E",
  authDomain: "gemablusprice-a2663.firebaseapp.com",
  projectId: "gemablusprice-a2663",
  storageBucket: "gemablusprice-a2663.firebasestorage.app",
  messagingSenderId: "922754795410",
  appId: "1:922754795410:web:4c4f3e73e4ac4c9008a34b",
  measurementId: "G-86PJQG21C1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const container = document.querySelector(".container");
const popup = document.getElementById("popup");

/* ✅ المتغير */
let selectedCategory = "الكل";
window.closeWelcome = function(){
  document.getElementById("welcomeBox").style.display = "none";
};


/* 🔐 تسجيل دخول */
window.login = async function() {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);

    const user = result.user;

    const q = query(collection(db,"users"), where("uid","==", user.uid));
    const snap = await getDocs(q);

    if(snap.empty){
      let name = prompt("اكتب اسمك 👇");
      if(!name) return alert("لازم تكتب اسم");

      await addDoc(collection(db,"users"),{
        uid: user.uid,
        name
      });
    }

    loadItems();

  } catch(e){
    alert(e.message);
  }
};

/* popup */
window.openAddPopup = () => popup.style.display="flex";
window.closePopup = () => popup.style.display="none";

/* 🎯 اختيار القسم */
window.selectCategory = function(cat, el){
  selectedCategory = cat;

  document.querySelectorAll(".cat-btn").forEach(btn=>{
    btn.classList.remove("active");
  });

  el.classList.add("active");

  loadItems(); // 🔥 دي أهم سطر
};
/* ➕ حفظ القصيدة */
window.saveItem = async function(){
  try {
    let poem = document.getElementById("name").value.trim();
    let title = document.getElementById("price").value.trim();

    if (!auth.currentUser){
      alert("سجل دخول الأول 🔐");
      return;
    }

    if (!poem || !title){
      alert("اكتب القصيدة والعنوان ✍️");
      return;
    }

    await addDoc(collection(db,"products"),{
  name: poem,
  price: title,
  category: document.getElementById("poemCategory").value,
  uid: auth.currentUser.uid,
  likes: 0,
  smiles: 0
});

    alert("✅ تم حفظ القصيدة");

    document.getElementById("name").value = "";
    document.getElementById("price").value = "";

    closePopup();
    loadItems();

  } catch(e){
    alert(e.message);
  }
};

/* ❤️ لايك */
function createLikeButton(data,id){
  let btn = document.createElement("button");
  btn.className = "like-btn";
  btn.innerHTML = `❤️ <span>${data.likes || 0}</span>`;

  btn.onclick = async ()=>{
    await updateDoc(doc(db,"products",id),{
      likes: increment(1)
    });
    loadItems();
  };

  return btn;
}

/* 😊 مبتسم */
function createSmileButton(data,id){
  let btn = document.createElement("button");
  btn.className = "smile-btn";
  btn.innerHTML = `😊 <span>${data.smiles || 0}</span>`;

  btn.onclick = async ()=>{
    await updateDoc(doc(db,"products",id),{
      smiles: increment(1)
    });
    loadItems();
  };

  return btn;
}

/* 🗑 حذف */
window.deleteItem = async function(id){
  let ok = confirm("متأكد تحذف القصيدة؟ 🗑");
  if(!ok) return;

  try {
    await deleteDoc(doc(db,"products",id));
    alert("✅ تم الحذف");
    myPosts();
  } catch(e){
    alert(e.message);
  }
};

/* 📦 عرض كل القصايد */
async function loadItems(){
  container.innerHTML = "";

  let q;

  if (selectedCategory === "الكل") {
    q = collection(db,"products");
  } else {
    q = query(
      collection(db,"products"),
      where("category", "==", selectedCategory)
    );
  }

  const snap = await getDocs(q);

  snap.forEach(docSnap=>{
    let data = docSnap.data();
    let id = docSnap.id;

    let div = document.createElement("div");
    div.className = "item";

    let title = document.createElement("h3");
    title.innerText = data.price;

    let cat = document.createElement("p");
    cat.innerText = data.category || "عام";

    let poem = document.createElement("p");
    poem.innerText = data.name;

    let actions = document.createElement("div");
    actions.className = "actions-row";

    actions.append(
      createLikeButton(data,id),
      createSmileButton(data,id)
    );

    div.append(title, cat, poem, actions);
    container.appendChild(div);
  });
}
/* 📦 منشوراتي */
window.myPosts = async function(){

  if (!auth.currentUser){
    alert("سجل دخول الأول");
    return;
  }

  container.innerHTML = "";

  const snap = await getDocs(collection(db,"products"));

  snap.forEach(docSnap=>{
    let data = docSnap.data();

    if(data.uid !== auth.currentUser.uid) return;

    let div = document.createElement("div");
    div.className = "item";

    div.innerHTML = `
      <h3>${data.price}</h3>
      <p style="white-space:pre-line">${data.name}</p>
      <p>❤️ ${data.likes || 0}</p>
      <p>😊 ${data.smiles || 0}</p>
      <button class="btn" onclick="deleteItem('${docSnap.id}')">🗑 حذف</button>
    `;

    container.appendChild(div);
  });
}

/* تشغيل أولي */
loadItems();