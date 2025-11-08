# Humu Slides – AI PPT Maker

Type your topic. Get your slides — instantly.

This is a **static web app** that:
- Generates a slide **outline locally** (no backend needed)
- Lets you **edit** slide titles & bullets
- Exports a **.pptx** file using [PptxGenJS](https://gitbrent.github.io/PptxGenJS/)

> Optional: You can plug in your own AI endpoint to generate richer content.

---

## 🚀 Quick Start (No Backend)
1. **Unzip** this folder.
2. Open `index.html` in a browser **or** host the folder on:
   - **GitHub Pages** (Settings → Pages)
   - **Netlify** (drag & drop the folder)
   - **Vercel** (import as static project)
3. Enter a topic → choose number of slides & theme → **Generate Outline**.
4. Edit slides if needed → **Download PPTX**.

> Everything runs in the browser. No server required.

---

## 🤖 Optional: AI Integration
If you want AI-generated slides:
1. Create a serverless function (Netlify/Vercel) at `/api/generate` that accepts:
   ```json
   { "topic": "Your topic", "slides": 6 }
   ```
   and returns:
   ```json
   [
     { "title": "Slide 1", "bullets": ["point 1", "point 2"] },
     ...
   ]
   ```
2. In `app.js`, set:
   ```js
   const AI_ENDPOINT = "/api/generate";
   ```

### Example Netlify Function (`netlify/functions/generate.js`)
```js
// Requires: npm i openai
import OpenAI from "openai";

export async function handler(event) {
  try {
    const { topic, slides = 6 } = JSON.parse(event.body||"{}");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `Create a ${slides}-slide outline about "${topic}". 
Return JSON array of objects with "title" and "bullets" (3-5 bullet points each).`;

    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const text = resp.choices[0].message.content;
    // Expecting an object with a property like { slides: [...] } or an array.
    let data;
    try { data = JSON.parse(text); } catch { data = { slides: [] }; }
    const arr = Array.isArray(data) ? data : (data.slides || []);
    return { statusCode: 200, body: JSON.stringify(arr) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: String(e) }) };
  }
}
```

> **Important:** Never expose your API key in client-side code. Use environment variables on the hosting platform.

---

## 🧩 Tech Used
- **Tailwind CSS** (CDN)
- **PptxGenJS** for PowerPoint creation
- Vanilla JS for logic

---

## 🎨 Themes
- **Modern Blue** (default)
- **Minimal Dark**
- **Mint Fresh**

You can add more in `app.js` under `themes`.

---

## 🛠 Customization
- Change default outline in `generateLocalOutline()` inside `app.js`.
- Edit branding (logo, name) in `index.html`.
- Add analytics or more pages as needed.

---

## 📄 License
MIT – use it freely for personal or commercial projects.
