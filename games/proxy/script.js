// -------------------- GLOBAL VARIABLES --------------------
const tabs=[];
let activeTab=null;
let privateMode=false;
let rightClickedTab=null;
let draggedBookmark=null;

// -------------------- INITIALIZATION --------------------
document.addEventListener("DOMContentLoaded",()=>{
  restoreSession();
  newTab();
  renderBookmarks();

  // Optional: request fullscreen on first user interaction
  const requestFS = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(()=>{});
    }
    document.removeEventListener("click", requestFS);
  };
  document.addEventListener("click", requestFS);
});

// -------------------- UTILITY FUNCTIONS --------------------
function showToast(msg){
  const toast=document.createElement("div");
  toast.className="toast";
  toast.textContent=msg;
  document.body.appendChild(toast);
  setTimeout(()=>toast.remove(),2000);
}

function formatURL(text){
  text=text.trim();
  try{
    if(!text.includes(".")&&!text.startsWith("http")) 
      return "https://duckduckgo.com/?q="+encodeURIComponent(text);
    const url=new URL(text.includes("://")?text:"https://"+text);
    return url.href;
  }catch{
    return "https://duckduckgo.com/?q="+encodeURIComponent(text);
  }
}

// -------------------- TAB FUNCTIONS --------------------
function newTab(url="https://duckduckgo.com", isPrivate=privateMode, title="Tab"){
  if(tabs.length>50){ showToast("Maximum 50 tabs open"); return; }
  const iframe=document.createElement("iframe");
  iframe.sandbox="allow-scripts allow-forms allow-popups";
  iframe.referrerPolicy="no-referrer";
  iframe.src=url;
  iframe.loading="lazy";

  const id=Date.now()+Math.random();
  tabs.push({id,iframe,title,private:isPrivate,history:[url],historyIndex:0,pinned:false});
  document.getElementById("viewerContainer").appendChild(iframe);

  iframe.onload=()=>{
    try{
      const pageTitle = iframe.contentDocument?.title || new URL(iframe.src).hostname;
      const tabObj=tabs.find(t=>t.iframe===iframe);
      if(tabObj) tabObj.title = pageTitle;
      if(activeTab===tabObj) document.title="Ultra Browser - "+pageTitle;
      renderTabs();
      saveSession();
    }catch{}
  };
  switchTab(id);
  renderTabs();
}

function switchTab(id){
  activeTab=tabs.find(t=>t.id===id);
  tabs.forEach(t=>t.iframe.style.display="none");
  if(activeTab){
    activeTab.iframe.style.display="block";
    document.getElementById("urlInput").value=activeTab.iframe.src;
    document.getElementById("dashboard").style.display="none";
    document.title="Ultra Browser - "+activeTab.title;
  } else document.getElementById("dashboard").style.display="flex";
  renderTabs();
}

function closeTab(id){
  const index=tabs.findIndex(t=>t.id===id);
  if(index===-1) return;
  tabs[index].iframe.remove();
  tabs.splice(index,1);
  if(tabs.length===0){ activeTab=null; document.getElementById("dashboard").style.display="flex"; document.title="Ultra Browser"; }
  else switchTab(tabs[Math.max(0,index-1)].id);
  saveSession();
}

// -------------------- NAVIGATION --------------------
function navigate(){
  if(!activeTab) return newTab(formatURL(document.getElementById("urlInput").value));
  const url=formatURL(document.getElementById("urlInput").value);
  activeTab.iframe.src=url;
  if(activeTab.historyIndex<activeTab.history.length-1) activeTab.history.splice(activeTab.historyIndex+1);
  activeTab.history.push(url);
  activeTab.historyIndex++;
}
function back(){ if(activeTab&&activeTab.historyIndex>0){ activeTab.historyIndex--; activeTab.iframe.src=activeTab.history[activeTab.historyIndex]; } }
function forward(){ if(activeTab&&activeTab.historyIndex<activeTab.history.length-1){ activeTab.historyIndex++; activeTab.iframe.src=activeTab.history[activeTab.historyIndex]; } }
function reload(){ if(activeTab) activeTab.iframe.contentWindow.location.reload(); }
function stop(){ if(activeTab) activeTab.iframe.contentWindow.stop(); }

// -------------------- THEME & PRIVATE --------------------
function toggleTheme(){
  document.body.classList.toggle("light");
  localStorage.setItem("theme",document.body.classList.contains("light")?"light":"dark");
}
function togglePrivate(){ privateMode=!privateMode; showToast(privateMode?"Private Mode Enabled":"Private Mode Disabled"); }

// -------------------- BOOKMARKS --------------------
function addBookmark(folder="default"){
  if(!activeTab||activeTab.private) return;
  let bookmarks=JSON.parse(localStorage.getItem("bookmarks")||"{}");
  if(!bookmarks[folder]) bookmarks[folder]=[];
  bookmarks[folder].push({url:activeTab.iframe.src,title:activeTab.title});
  localStorage.setItem("bookmarks",JSON.stringify(bookmarks));
  renderBookmarks();
}

function renderBookmarks(){
  const container=document.getElementById("bookmarks");
  container.innerHTML="";
  if(activeTab?.private) return;
  let bookmarks=JSON.parse(localStorage.getItem("bookmarks")||"{}");
  for(let folder in bookmarks){
    const folderDiv=document.createElement("div");
    folderDiv.className="bookmark-folder";
    folderDiv.textContent=folder;
    const content=document.createElement("div");
    content.className="folder-content";

    bookmarks[folder].forEach((b,i)=>{
      const btn=document.createElement("button");
      btn.textContent=b.title;
      btn.onclick=()=>activeTab.iframe.src=b.url;
      btn.draggable=true;
      btn.ondragstart=(e)=>{ draggedBookmark={folder,index:i}; }
      btn.ondragover=(e)=>e.preventDefault();
      btn.ondrop=(e)=>{
        e.preventDefault();
        if(!draggedBookmark) return;
        let targetFolder=folder;
        let bookmark=bookmarks[draggedBookmark.folder][draggedBookmark.index];
        bookmarks[draggedBookmark.folder].splice(draggedBookmark.index,1);
        bookmarks[targetFolder].push(bookmark);
        localStorage.setItem("bookmarks",JSON.stringify(bookmarks));
        renderBookmarks();
        draggedBookmark=null;
      };
      btn.oncontextmenu=(e)=>{
        e.preventDefault();
        if(confirm(`Delete bookmark '${b.title}' from ${folder}?`)){
          bookmarks[folder].splice(i,1);
          localStorage.setItem("bookmarks",JSON.stringify(bookmarks));
          renderBookmarks();
        }
      };
      content.appendChild(btn);
    });

    folderDiv.appendChild(content);
    container.appendChild(folderDiv);
  }
}

function clearBookmarks(){ localStorage.removeItem("bookmarks"); renderBookmarks(); }
function manageFolders(){
  const folderName=prompt("Enter folder name to create:");
  if(folderName){
    let bookmarks=JSON.parse(localStorage.getItem("bookmarks")||"{}");
    if(!bookmarks[folderName]) bookmarks[folderName]=[];
    localStorage.setItem("bookmarks",JSON.stringify(bookmarks));
    renderBookmarks();
  }
}

function exportBookmarks(){
  const data=JSON.stringify(localStorage.getItem("bookmarks")||"{}");
  const blob=new Blob([data],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download="bookmarks.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importBookmarks(){
  const input=document.createElement("input");
  input.type="file";
  input.accept=".json";
  input.onchange=()=>{ 
    const file=input.files[0];
    if(!file) return;
    const reader=new FileReader();
    reader.onload=()=>{ localStorage.setItem("bookmarks",reader.result); renderBookmarks(); };
    reader.readAsText(file);
  };
  input.click();
}

// -------------------- TAB RENDER --------------------
function renderTabs(){
  const container=document.getElementById("tabs");
  container.innerHTML="";
  tabs.forEach((t,index)=>{
    const tab=document.createElement("div");
    tab.className="tab"+(t.id===activeTab?.id?" active":"")+(t.private?" private":"")+(t.pinned?" pinned":"");
    tab.setAttribute("role","tab");
    const favicon=document.createElement("img");
    favicon.className="favicon";
    try{favicon.src=new URL(t.iframe.src).origin+"/favicon.ico";}catch{favicon.src="favicon.png";}
    const titleSpan=document.createElement("span");
    titleSpan.textContent=t.title || "Tab";
    const close=document.createElement("span");
    close.className="closeTab";
    close.textContent="×";
    close.onclick=(e)=>{ e.stopPropagation(); closeTab(t.id); saveSession(); }

    tab.appendChild(favicon);
    tab.appendChild(titleSpan);
    tab.appendChild(close);
    tab.onclick=()=>switchTab(t.id);
    tab.oncontextmenu=(e)=>{ e.preventDefault(); rightClickedTab=t.id; showMenu(e.pageX,e.pageY); };

    tab.draggable=true;
    tab.ondragstart=(e)=>{ e.dataTransfer.setData("text/plain",index); };
    tab.ondragover=(e)=>e.preventDefault();
    tab.ondrop=(e)=>{
      const fromIndex=parseInt(e.dataTransfer.getData("text/plain"));
      const moved=tabs.splice(fromIndex,1)[0];
      tabs.splice(index,0,moved);
      renderTabs();
    };

    container.appendChild(tab);
  });
}

// -------------------- SESSION --------------------
function saveSession(){
  const session=tabs.filter(t=>!t.private).map(t=>({url:t.iframe.src,title:t.title}));
  localStorage.setItem("session",JSON.stringify(session));
}
function restoreSession(){
  if(localStorage.getItem("session")){
    const savedTabs=JSON.parse(localStorage.getItem("session"));
    savedTabs.forEach(t=>newTab(t.url,false,t.title));
  }
}

// -------------------- CONTEXT MENU --------------------
function showMenu(x,y){ 
  const menu=document.getElementById("tabMenu"); 
  menu.style.display="flex"; 
  menu.style.left=x+"px"; 
  menu.style.top=y+"px"; 
}

// -------------------- KEYBOARD SHORTCUTS --------------------
document.addEventListener("click",()=>{ document.getElementById("tabMenu").style.display="none"; });
document.addEventListener("keydown",(e)=>{
  if(e.ctrlKey&&e.shiftKey&&e.key==="T"){ e.preventDefault(); newTab("https://duckduckgo.com",true); }
  if(e.ctrlKey&&e.key==="t"){ e.preventDefault(); newTab(); }
  if(e.ctrlKey&&e.key==="w"){ e.preventDefault(); closeTab(activeTab?.id); }
  if(e.ctrlKey&&e.key==="l"){ e.preventDefault(); document.getElementById("urlInput").focus(); }
  if(e.ctrlKey&&e.key==="d"){ e.preventDefault(); addBookmark(); }

  // Left/Right tab navigation
  if(e.key==="ArrowLeft" && activeTab){
    const idx=tabs.findIndex(t=>t.id===activeTab.id);
    if(idx>0) switchTab(tabs[idx-1].id);
  }
  if(e.key==="ArrowRight" && activeTab){
    const idx=tabs.findIndex(t=>t.id===activeTab.id);
    if(idx<tabs.length-1) switchTab(tabs[idx+1].id);
  }
});
