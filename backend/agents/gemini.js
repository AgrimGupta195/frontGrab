
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
function cleanJSON(str) {
  return str
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}
export async function generateHtmlClone(htmlContent, cssContent, jsContent) {
  const prompt = `
      You are an expert web developer tasked with creating a static clone of a website for educational purposes.
      Based on the provided raw HTML, CSS,Javascript your goal is to generate a clean, functional, and self-contained set of HTML, CSS, and JavaScript files.

      RAW HTML:
      ${htmlContent?.substring(0, 4000) || ""}

      RAW CSS:
      ${cssContent?.substring(0, 4000) || ""}

      INSTRUCTIONS:
      1.  **Refine the HTML**: Clean up the provided HTML. Ensure all asset paths (images, etc.) are relative. Remove any server-side scripts or irrelevant tags. The goal is a clean 'index.html' file don't right tailwind classes write that in style.css.
      2.  **Refine the CSS**: Consolidate the provided CSS into a single, well-organized 'style.css' file. Add comments explaining complex selectors or properties if there is inline css or tailwind classes in html code make in style.css.
      3.  **Extract JavaScript**: Identify and extract any inline JavaScript from the HTML into a 'script.js' file. Ensure it is properly formatted and functional for client-side interactions.
      4.  **Format the Output**: Return a single JSON object with three keys: "html", "css", and "js". The value for each key should be a string containing the complete code for that file.

      EXAMPLE OUTPUT FORMAT:
      {
        "html": "<!DOCTYPE html><html>...</html>",
        "css": "body { ... }",
        "js": "document.addEventListener('DOMContentLoaded', () => { ... });"
      }

      IMPORTANT: Do not add any new features or content. Your task is to accurately clone the frontend structure and style based *only* on the provided content. Return ONLY the valid JSON object.
    `;

    try {
      const response = await client.chat.completions.create({
        model: "gpt-4o", // Using a powerful model for this complex task
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that generates website code in JSON format.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.5, // Lower temperature for more deterministic output
        max_tokens: 4095,
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      console.error("HTML Clone Generation API error:", error);
      throw new Error(`HTML clone generation failed: ${error.message}`);
    }
}
