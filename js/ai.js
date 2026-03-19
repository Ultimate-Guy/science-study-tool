import fs from "fs";
import path from "path";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const OUTPUT_DIR = "pages";

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Fallback content if AI fails
function fallbackPage(title) {
  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
</head>
<body>
  <h1>${title}</h1>
  <p>AI content generation failed or API key missing.</p>
</body>
</html>`;
}

async function generatePage(title, filename) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.log("No API key — using fallback for", title);
      fs.writeFileSync(path.join(OUTPUT_DIR, filename), fallbackPage(title));
      return;
    }

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: `Create a simple clean HTML page about: ${title}.
Only return valid HTML. No markdown.`,
    });

    const html = response.output_text || fallbackPage(title);

    fs.writeFileSync(path.join(OUTPUT_DIR, filename), html);
    console.log("Generated:", filename);
  } catch (err) {
    console.error("Error generating page:", err.message);
    fs.writeFileSync(path.join(OUTPUT_DIR, filename), fallbackPage(title));
  }
}

async function main() {
  console.log("Starting AI page generation...");

  const pages = [
    { title: "Home Page", file: "index.html" },
    { title: "About Us", file: "about.html" },
    { title: "Contact Page", file: "contact.html" },
    { title: "Services", file: "services.html" },
  ];

  for (const page of pages) {
    await generatePage(page.title, page.file);
  }

  console.log("Done generating pages.");
}

main();
