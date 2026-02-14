// --- 1. FIREBASE INITIALIZATION ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getDatabase, ref, push, onValue, set } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyABJUzG_HU96B7kyNfDDx9psRR0qKTpNQg", // Iddoo kana Firebase Key keetiin bakka buusi
    authDomain: "oro-connect-1.firebaseapp.com",
    databaseURL: "https://oro-connect-1-default-rtdb.firebaseio.com",
    projectId: "oro-connect-1"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const postsRef = ref(db, 'posts');
const chatsRef = ref(db, 'chats');

// --- 2. STATE & VARIABLES ---
let currentUser = JSON.parse(localStorage.getItem('user')) || null;
let postMediaBase64 = "";
let mediaType = "";
let chatFileBase64 = "";
let blockedUsers = [];

// Namoota fakkeenyaa (Example Users)
const suggestedUsers = [
    { name: "Caalaa Beekaa", bio: "Web Developer", loc: "Finfinnee", followers: "1.2k", img: "https://i.pravatar.cc/150?u=10" },
    { name: "Muluu Tolasaa", bio: "UI/UX Designer", loc: "Adaamaa", followers: "850", img: "https://i.pravatar.cc/150?u=11" },
    { name: "Obbo Alamaayyoo", bio: "Giddu-gala Oromummaa", loc: "Jimma", followers: "5k", img: "https://i.pravatar.cc/150?u=1" }
];

// --- 3. AUTH & APP LOAD ---
window.handleLogin = function() {
    const name = document.getElementById('username').value;
    const email = document.getElementById('user_email').value;
    if(name && email) {
        currentUser = { 
            name, 
            email, 
            avatar: `https://ui-avatars.com/api/?name=${name}&background=random` 
        };
        localStorage.setItem('user', JSON.stringify(currentUser));
        loadApp();
    } else { alert("Maaloo guutii!"); }
};

window.loadApp = function() {
    if(!currentUser) return;
    document.getElementById('login-page').classList.remove('active');
    document.getElementById('main-app').classList.add('active');
    document.querySelectorAll('.current-user-img').forEach(img => img.src = currentUser.avatar);
    renderUserList();
};

// --- 4. NAVIGATION ---
window.showView = function(viewId, element) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    element.classList.add('active');
};

window.handleLogout = function() {
    if(confirm("Dhuguma ba'uu (Logout) barbaaddu?")) {
        localStorage.removeItem('user');
        location.reload();
    }
};

// --- 5. POSTING LOGIC (IMAGE/VIDEO) ---
window.previewFile = function() {
    const file = document.getElementById('postImg').files[0];
    const preview = document.getElementById('imgPreview');
    const reader = new FileReader();

    if (file) {
        mediaType = file.type.startsWith('video') ? 'video' : 'image';
        reader.onloadend = () => {
            postMediaBase64 = reader.result;
            preview.style.display = "block";
            preview.innerHTML = mediaType === 'video' 
                ? `<video src="${reader.result}" controls style="width:100%; border-radius:10px;"></video>` 
                : `<img src="${reader.result}" style="width:100%; border-radius:10px;">`;
        };
        reader.readAsDataURL(file);
    }
};

window.addNewPost = function() {
    const text = document.getElementById('postText').value;
    if(!text && !postMediaBase64) return;

    push(postsRef, {
        author: currentUser.name,
        avatar: currentUser.avatar,
        content: text,
        media: postMediaBase64,
        mType: mediaType,
        date: new Date().toLocaleString()
    }).then(() => {
        document.getElementById('postText').value = "";
        document.getElementById('imgPreview').style.display = "none";
        postMediaBase64 = "";
    });
};

// Real-time Feeds
onValue(postsRef, (snapshot) => {
    const feeds = document.getElementById('feeds');
    const data = snapshot.val();
    if(!feeds) return;
    feeds.innerHTML = "";
    if(data) {
        Object.keys(data).reverse().forEach(key => {
            const p = data[key];
            let mediaHtml = p.media ? (p.mType === 'video' ? `<video src="${p.media}" controls style="width:100%; border-radius:10px; margin-top:10px;"></video>` : `<img src="${p.media}" style="width:100%; border-radius:10px; margin-top:10px;">`) : "";
            feeds.innerHTML += `
                <div class="card">
                    <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                        <img src="${p.avatar}" style="width:40px; border-radius:50%;">
                        <div>
                            <b>${p.author}</b>
                            <p style="font-size:0.7rem; opacity:0.5; margin:0;">${p.date}</p>
                        </div>
                    </div>
                    <p>${p.content}</p>
                    ${mediaHtml}
                </div>`;
        });
    }
});

// --- 6. CHAT & MESSAGES ---
window.previewChatFile = function() {
    const file = document.getElementById('chatFileInput').files[0];
    const previewArea = document.getElementById('chatFilePreview');
    const reader = new FileReader();
    if(file) {
        reader.onloadend = () => {
            chatFileBase64 = reader.result;
            previewArea.style.display = "block";
            previewArea.innerHTML = `<img src="${reader.result}" style="height:50px; border-radius:5px;">`;
        };
        reader.readAsDataURL(file);
    }
};

window.sendChatMessage = function() {
    const input = document.getElementById('chatInput');
    const msg = input.value;
    if(!msg && !chatFileBase64) return;

    push(chatsRef, {
        sender: currentUser.name,
        text: msg,
        file: chatFileBase64,
        time: new Date().toLocaleTimeString()
    });
    input.value = "";
    chatFileBase64 = "";
    document.getElementById('chatFilePreview').style.display = "none";
};

onValue(chatsRef, (snapshot) => {
    const display = document.getElementById('chatDisplay');
    const data = snapshot.val();
    if(!display || !data) return;
    display.innerHTML = "";
    Object.values(data).forEach(m => {
        const isMe = m.sender === currentUser.name;
        let fileHtml = m.file ? `<img src="${m.file}" style="max-width:200px; display:block; border-radius:10px; margin-bottom:5px;">` : "";
        display.innerHTML += `
            <div style="align-self: ${isMe ? 'flex-end' : 'flex-start'}; 
                        background: ${isMe ? 'var(--aba-red)' : '#e4e6eb'}; 
                        color: ${isMe ? 'white' : 'black'}; 
                        padding: 10px 15px; border-radius: 18px; max-width: 75%; margin-bottom: 5px;">
                ${fileHtml}
                <span>${m.text}</span>
                <small style="display:block; font-size:0.6rem; opacity:0.7; text-align:right;">${m.time}</small>
            </div>`;
    });
    display.scrollTop = display.scrollHeight;
});

// --- 7. USER LIST & MODAL ---
window.renderUserList = function() {
    const box = document.getElementById('user-list-box');
    if(!box) return;
    box.innerHTML = suggestedUsers.map(u => `
        <div class="user-card">
            <div class="user-info" onclick="showProfile('${u.name}', '${u.bio}', '${u.loc}', '${u.followers}')">
                <img src="${u.img}">
                <div class="user-name">${u.name}</div>
            </div>
            <div class="btn-group">
                <button class="btn-main small-btn" onclick="this.innerText='Eegamaa...'">Add</button>
            </div>
        </div>
    `).join('');
};

window.showProfile = function(name, bio, loc, followers) {
    document.getElementById('modalName').innerText = name;
    document.getElementById('modalBio').innerText = bio;
    document.getElementById('profileModal').style.display = "flex";
};

window.closeModal = function() {
    document.getElementById('profileModal').style.display = "none";
};

// --- 8. SETTINGS & UTILS ---
window.toggleDarkMode = function() {
    document.body.classList.toggle('dark-mode');
};

window.updateProfilePic = function() {
    const file = document.getElementById('profileInput').files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
        currentUser.avatar = reader.result;
        localStorage.setItem('user', JSON.stringify(currentUser));
        document.querySelectorAll('.current-user-img').forEach(img => img.src = reader.result);
    };
    if(file) reader.readAsDataURL(file);
};

window.blockUser = function() {
    const name = document.getElementById('block_user_name').value;
    if(name) {
        blockedUsers.push(name);
        document.getElementById('blocked-list').innerHTML += `<div style="padding:5px; background:#eee; margin:2px; display:inline-block; border-radius:5px;">${name}</div>`;
        document.getElementById('block_user_name').value = "";
    }
};

window.saveAllSettings = function() {
    alert("Odeeffannoon kee hundi sirreeffameera!");
};

window.changeLanguage = function() {
    const lang = document.getElementById('set_language').value;
    alert("Afaan filatame: " + lang);
};

// Start logic
if(currentUser) loadApp();
