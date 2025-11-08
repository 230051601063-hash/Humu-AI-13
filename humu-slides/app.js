// Humu Slides – front-end only prototype
// - Generates a slide outline locally
// - Builds a .pptx via PptxGenJS
// - Optional AI endpoint hook: set AI_ENDPOINT and implement a serverless function

const AI_ENDPOINT = ""; // e.g., "/api/generate" (see README)

const themes = {
  modernBlue: { bg: "FFFFFF", titleColor: "1E3A8A", textColor: "0F172A", accent: "3B82F6" },
  minimalDark: { bg: "0B1220", titleColor: "FFFFFF", textColor: "E5E7EB", accent: "60A5FA" },
  mint: { bg: "F0FDF4", titleColor: "064E3B", textColor: "065F46", accent: "10B981" },
};

let state = {
  slides: [], // { title: string, bullets: string[] }
  currentIndex: 0,
  themeKey: "modernBlue",
};

function $(id){ return document.getElementById(id); }

function generateLocalOutline(topic, count){
  // Simple heuristic outline
  const base = [
    { title: topic, bullets: ["An overview", "Key ideas", "Why it matters"] },
    { title: "Definition & Overview", bullets: [`What is ${topic}?`, "Core concepts", "Examples"] },
    { title: "Key Components", bullets: ["Elements", "Architecture", "Workflow"] },
    { title: "Applications", bullets: ["Use cases", "Who uses it?", "Impact"] },
    { title: "Benefits & Challenges", bullets: ["Advantages", "Limitations", "Risks"] },
    { title: "Future Trends", bullets: ["What’s next?", "Opportunities", "Predictions"] },
    { title: "Conclusion", bullets: ["Summary", "Takeaways", "References/Next steps"] },
  ];
  // Expand or trim to desired count
  let slides = [];
  for(let i=0;i<count;i++){
    slides.push(base[i % base.length]);
  }
  // Deep copy to allow edits
  return slides.map(s => ({ title: s.title, bullets: [...s.bullets] }));
}

async function maybeCallAI(topic, count){
  if(!AI_ENDPOINT) return null;
  try{
    const res = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, slides: count })
    });
    if(!res.ok) throw new Error("AI endpoint error");
    const data = await res.json(); // expected: [{title, bullets:[]}, ...]
    if(Array.isArray(data) && data.length) return data;
  }catch(e){
    console.warn("AI generation failed; falling back to local outline.", e);
  }
  return null;
}

function renderSlidesList(){
  const ul = $("slidesList");
  ul.innerHTML = "";
  state.slides.forEach((s, idx)=>{
    const li = document.createElement("li");
    li.className = "rounded-xl border border-slate-200 p-3 cursor-pointer hover:bg-slate-50 " + (idx===state.currentIndex ? "ring-2 ring-indigo-500" : "");
    li.innerHTML = `<div class="text-sm font-semibold truncate">${idx+1}. ${s.title||"Untitled"}</div>
      <div class="text-xs text-slate-500">${s.bullets.length} bullets</div>`;
    li.onclick = ()=>{
      state.currentIndex = idx;
      loadEditor();
      renderSlidesList();
    };
    ul.appendChild(li);
  });
  $("btnDownload").disabled = state.slides.length === 0;
}

function loadEditor(){
  const s = state.slides[state.currentIndex] || { title:"", bullets:[] };
  $("slideTitle").value = s.title || "";
  $("slideBullets").value = (s.bullets||[]).join("\n");
}

function saveCurrentSlide(){
  const title = $("slideTitle").value.trim();
  const bullets = $("slideBullets").value.split("\n").map(b=>b.trim()).filter(Boolean);
  state.slides[state.currentIndex] = { title, bullets };
  renderSlidesList();
}

function addSlide(){
  state.slides.push({ title: "New Slide", bullets: ["Point 1","Point 2","Point 3"] });
  state.currentIndex = state.slides.length - 1;
  renderSlidesList();
  loadEditor();
}

function deleteSlide(){
  if(state.slides.length===0) return;
  state.slides.splice(state.currentIndex,1);
  state.currentIndex = Math.max(0, state.currentIndex-1);
  renderSlidesList();
  loadEditor();
}

async function handleGenerate(){
  const topic = $("topic").value.trim();
  const count = Math.max(3, Math.min(20, parseInt($("slidesCount").value || "6", 10)));
  state.themeKey = $("theme").value;
  if(!topic){
    alert("Please enter a topic.");
    return;
  }
  // Try AI; fallback to local
  const ai = await maybeCallAI(topic, count);
  state.slides = ai || generateLocalOutline(topic, count);
  state.currentIndex = 0;
  renderSlidesList();
  loadEditor();
}

function toPptx(){
  const theme = themes[state.themeKey] || themes.modernBlue;
  const pptx = new PptxGenJS();
  pptx.author = "Humu Slides";
  pptx.company = "Humu";
  pptx.title = state.slides[0]?.title || "Humu Slides";

  state.slides.forEach((s, idx)=>{
    const slide = pptx.addSlide();
    slide.background = { color: theme.bg };

    // Title
    slide.addText(s.title || `Slide ${idx+1}`, {
      x: 0.5, y: 0.5, w: 9, h: 1,
      fontFace: "Arial", fontSize: 30, bold: true, color: theme.titleColor
    });

    // Accent line
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.5, y: 1.4, w: 2.5, h: 0.12, fill: { color: theme.accent }, line: { color: theme.accent }
    });

    // Bullets
    const bullets = (s.bullets||[]).map(b=>({ text: b, options: { bullet: true } }));
    slide.addText(bullets, {
      x: 0.75, y: 1.8, w: 8.5, h: 4.5,
      fontFace: "Arial", fontSize: 18, color: theme.textColor
    });

    // Footer
    slide.addText(`Humu Slides`, {
      x: 0.5, y: 6.7, w: 9, h: 0.4,
      fontFace: "Arial", fontSize: 10, color: theme.textColor, align: "right"
    });
  });

  const filename = (state.slides[0]?.title || "Humu Slides").replace(/[^\w\s-]/g,"").replace(/\s+/g,"-");
  pptx.writeFile({ fileName: filename + ".pptx" });
}

// Wire up events
$("btnGenerate").addEventListener("click", handleGenerate);
$("btnDownload").addEventListener("click", toPptx);
$("btnSaveSlide").addEventListener("click", saveCurrentSlide);
$("btnAddSlide").addEventListener("click", addSlide);
$("btnDeleteSlide").addEventListener("click", deleteSlide);

// Enable/disable download button by state
const observer = new MutationObserver(()=>{
  $("btnDownload").disabled = state.slides.length === 0;
});
observer.observe($("slidesList"), { childList: true, subtree: true });

// Initial editor state
renderSlidesList();
loadEditor();
