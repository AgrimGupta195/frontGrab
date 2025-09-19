import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const client = new OpenAI({
   apiKey: process.env.GEMINI_API_KEY,
   baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
});


// Helper → clean model output before JSON.parse
function cleanJSON(str) {
  return str
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

export async function correctUrl(url) {
  const prompt = `
    You are a very smart helpful assistant that only returns the official homepage URL 
    for a given company, product, or service for the given keyword.
    - If the input is already a valid URL, return it as-is.
    - If it's missing protocol, add https://
    - If it's just a keyword (like "lenovo"), return the official site.

    OUTPUT FORMAT:         
    {
      "url": "https://www.example.com"
    }
  `;

  try {
    const response = await client.chat.completions.create({
      model: "gemini-1.5-flash",
      messages: [
        {
          role: "system",
          content: prompt,
        },
        {
          role: "user",
          content: `Give me the official website URL for: "${url}"`,
        },
      ],
    });

    const rawContent = response.choices[0].message.content;
    const cleaned = cleanJSON(rawContent);

    // Parse JSON safely
    const parsed = JSON.parse(cleaned);

    // Ensure url is valid
    if (!parsed.url) throw new Error("Model did not return a URL.");
    return parsed.url;

  } catch (error) {
    console.error("❌ Url corrector error:", error);
    throw new Error(`Url correction failed: ${error.message}`);
  }
}



