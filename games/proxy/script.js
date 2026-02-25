// -------------------- GLOBAL --------------------
const tabs = [];
let activeTab = null;
let privateMode = false;

// -------------------- INIT --------------------
document.addEventListener("DOMContentLoaded", () => {
  restoreSession();
  renderBookmarks();
});

// -------------------- TOAST --------------------
function showToast(msg){
  const toast=document.createElement("div");
  toast.className="toast";
  toast.textContent=msg;
  document.body.appendChild(toast);
  setTimeout(()=>toast.remove(),2000);
}

// -------------------- TAB FUNCTIONS --------------------
function newTab(url = "", isPrivate = privateMode, title = "Tab"){
  const iframe = document.createElement("iframe");
  iframe.sandbox = "allow-scripts allow-forms allow-popups";
  iframe.src = url || "";
  iframe.style.display = "none";
  document.getElementById("viewerContainer").appendChild(iframe);

  const id = Date.now() + Math.random();
  tabs.push({id, iframe, title, private: isPrivate});
  switchTab(id);
  renderTabs();
}

function switchTab(id){
  activeTab = tabs.find(t => t.id === id);
  tabs.forEach(t => t.iframe.style.display = "none");
  if(activeTab){
    activeTab.iframe.style.display = "block";
    document.getElementById("urlInput").value = activeTab.iframe.src;
    document.getElementById("dashboard").style.display = activeTab.iframe.src ? "none" : "flex";
    document.title = "Ultra Browser - " + activeTab.title;
  }
  renderTabs();
}

// -------------------- NAVIGATION --------------------
function navigate(){
  const input = document.getElementById("urlInput").value.trim();
  if(!activeTab) return newTab(input);

  if(input.startsWith("http")){
    activeTab.iframe.src = input;
    activeTab.title = input;
  } else {
    // treat as search
    searchDDGManual(input);
  }
}

// -------------------- DUCKDUCKGO SEARCH --------------------
function searchDDG(event){
  event.preventDefault();
  const query = document.getElementById("searchInput").value.trim();
  if(!query) return;
  searchDDGManual(query);
}

function searchDDGManual(query){
  document.getElementById("dashboard").style.display = "flex";
  const resultsDiv = document.getElementById("searchResults");
  resultsDiv.innerHTML = "Searching...";

  fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&skip_disambig=1`)
    .then(res => res.json())
    .then(data => {
      resultsDiv.innerHTML = "";
      if(data.AbstractURL){
        const a = document.createElement("a");
        a.href = data.AbstractURL;
        a.textContent = data.Heading;
        a.target = "_blank";
        resultsDiv.appendChild(a);
      }
      if(data.RelatedTopics && data.RelatedTopics.length){
        data.RelatedTopics.forEach(item => {
          if(item.Text && item.FirstURL){
            const a = document.createElement("a");
            a.href = item.FirstURL;
            a.textContent = item.Text;
            a.target = "_blank";
            resultsDiv.appendChild(a);
            resultsDiv.appendChild(document.createElement("br"));
          }
        });
      }
    }).catch(err => {
      resultsDiv.innerHTML = "Error fetching results.";
      console.error(err);
    });
}

// -------------------- THEME & PRIVATE --------------------
function toggleTheme(){
  document.body.classList.toggle("light");
  localStorage.setItem("theme", document.body.classList.contains("light") ? "light" : "dark");
}
function togglePrivate(){ privateMode = !privateMode; showToast(privateMode ? "Private Mode Enabled" : "Private Mode Disabled"); }

// -------------------- BOOKMARKS --------------------
function addBookmark(){
  if(!activeTab || activeTab.private) return;
  let bookmarks = JSON.parse(localStorage.getItem("bookmarks") || "{}");
  if(!bookmarks.default) bookmarks.default = [];
  bookmarks.default.push({url: activeTab.iframe.src, title: activeTab.title});
  localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
  renderBookmarks();
}

function renderBookmarks(){
  const container = document.getElementById("bookmarks");
  container.innerHTML = "";
  let bookmarks = JSON.parse(localStorage.getItem("bookmarks") || "{}");
  for(let folder in bookmarks){
    bookmarks[folder].forEach((b,i)=>{
      const btn = document.createElement("button");
      btn.textContent = b.title;
      btn.onclick = ()=>window.open(b.url, "_blank");
      container.appendChild(btn);
    });
  }
}

function clearBookmarks(){ localStorage.removeItem("bookmarks"); renderBookmarks(); }

// -------------------- SESSION --------------------
function saveSession(){ 
  const session = tabs.filter(t => !t.private).map(t => ({url:t.iframe.src, title:t.title}));
  localStorage.setItem("session", JSON.stringify(session));
}
function restoreSession(){
  if(localStorage.getItem("session")){
    JSON.parse(localStorage.getItem("session")).forEach(t => newTab(t.url, false, t.title));
  }
}

// -------------------- TAB RENDER --------------------
function renderTabs(){
  const container = document.getElementById("tabs");
  container.innerHTML = "";
  tabs.forEach(t=>{
    const tab = document.createElement("div");
    tab.className = "tab" + (t.id === activeTab?.id ? " active" : "");
    tab.textContent = t.title || "Tab";
    tab.onclick = () => switchTab(t.id);
    container.appendChild(tab);
  });
}
