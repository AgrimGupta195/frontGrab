// import OpenAI from "openai";
// import dotenv from "dotenv";
// import { encoding_for_model } from "tiktoken";

// dotenv.config();

// const client = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// // helper: count tokens
// function countTokens(model, text) {
//   const enc = encoding_for_model(model);
//   return enc.encode(text).length;
// }

// // select model
// function selectModel(totalTokens) {
//   if (totalTokens < 120000) return "gpt-4.1-mini";
//   if (totalTokens < 500000) return "gpt-4.1";
//   return "gpt-4"; // fallback
// }

// // chunk HTML/CSS/JS so that query + mysite + chunk <= CHUNK_SIZE
// function chunkCode(html, css, js, query, mysite, model, maxTokensPerRequest = 40000) {
//   const baseTokens = countTokens(model, `Query:\n${query}\nMysite:\n${mysite}\n`);
//   const availableTokens = maxTokensPerRequest - baseTokens;

//   // combine code
//   const fullCode = `HTML:\n${html}\nCSS:\n${css}\nJS:\n${js}`;
//   const codeTokens = countTokens(model, fullCode);

//   if (codeTokens <= availableTokens) return [fullCode]; // fits in one request

//   // chunk code into multiple parts
//   const enc = encoding_for_model(model);
//   const tokens = enc.encode(fullCode);
//   const chunks = [];
//   for (let i = 0; i < tokens.length; i += availableTokens) {
//     const slice = tokens.slice(i, i + availableTokens);
//     chunks.push(enc.decode(slice));
//   }
//   return chunks;
// }
// export async function frontendWorker(query, mysite, html, css, js) {
//   // combine all content for token calculation
//    const combinedContent = `${query}\n${mysite}\n${html}\n${css}\n${js}`;
//   const totalTokens = countTokens("gpt-4", combinedContent);
//   const model = selectModel(totalTokens);

//   const codeChunks = chunkCode(html, css, js, query, mysite, model, 40000);

//   let finalHTML = "";
//   let finalCSS = "";
//   let finalJS = "";

//   for (const chunk of codeChunks) {
//     const systemPrompt = `
    
//     You are an expert Frontend Developer who works on START, THINK and OUTPUT format.
//     For a given user query first think and breakdown the problem into sub problems.
//     You should always keep thinking and thinking before giving the actual output.

//      Also, before outputing the final result to user you must check once if everything is correct.
//     Task: 
// -Given a user query,giving inspiration HTML/CSS/JS code in chunks,ser’s site content ("mysite"), you must tailor the inspiration design to the user’s site.
// - Identify the correct snippet from the commented inspirations (Amazon, Myntra, Flipkart, etc.).
// - Extract that snippet and clean it (remove comments).
// - Merge it with the user’s provided code if given.
//     Rules:
//     - Strictly follow the output JSON format
//     - Always follow the output in sequence that is START, THINK, OBSERVE and OUTPUT.
//     - Always perform only one step at a time and wait for other step.
//     - Alway make sure to do multiple steps of thinking before giving out output.
//     - Only include the snippet the user requested.
// - If user says "Navbar like Amazon", fetch only the Amazon Navbar block.
// - Always ensure CSS selectors and JS match the chosen HTML snippet.
// - Do not include unrelated inspiration blocks

//     Input: format
//     { "query":"User Query" , "html": "<!Doctype html><html>...</html>", "css": "body { ... }", "js": "console.log('Hello, world!');" }

//     Output JSON Format:
//     { "html":<!Doctype html><html>...</html>, "css": "body { ... }", "js": "console.log('Hello, world!');" }

//     Example:
//     User: Hey could you please read this code and make it better using the same design and content?
//     ASSISTANT: { "step": "START", "content": "The user wants me to combine the html css js code and made it according to user query and he wants to tailored data according to his site" }

//     ASSISTANT: { "step": "THINK", "content": "Let me analyze the user query"" } 
//     ASSISTANT: { "step": "OBSERVE", "content": "Let me analyze the data of user site" }
//     ASSISTANT: { "step": "THINK", "content": "Now i am analyzing the chunk of code that you gave me" }
//     ASSISTANT: { "step": "OBSERVE", "content": "Now user want that i have to grab parts of code according to query" }
//     ASSISTANT: { "step": "THINK", "content": "now make html acc to the html code and tailored the content acc to site that you give me and name it index.html"}
//     ASSISTANT: { "step": "OBSERVE", "content": "let me check the css code that use gave me" }
//     ASSISTANT: { "step": "THINK", "content": "now make css acc to the html code and based on the design of css that you give me and name it style.css" }
//     ASSISTANT: { "step": "OBSERVE", "content": "let me check the js code that you gave me" }
//     ASSISTANT: { "step": "THINK", "content": "now make js acc to the html code" }
//     ASSISTANT: { "step": "THINK", "content": "now i have to add all this code to one file" }
//     ASSISTANT: { "step": "THINK", "content": "Great i got the code now link them all" }
//     ASSISTANT: { "step": "OUTPUT", "content": "{html:<!Doctype html><html>...</html>, css: "body { ... }", js: "console.log('Hello, world!');}" }
//   ;

//     `;

//     const messages = [
//       { role: "system", content: systemPrompt },
//       {
//         role: "user",
//         content: `{"query": "please fix this code and make it better acc to ${query} but use my content that i give you ${mysite}"
//                   ,chunk": "${chunk}"}`,
//       },
//     ];

//     const response = await client.chat.completions.create({
//       model: model,
//       messages: messages,
//     });

//     const rawContent = response.choices[0].message.content;
//     let parsedContent;
//     try {
//       parsedContent = JSON.parse(rawContent);
//     } catch {
//       // fallback: sometimes rawContent is already JSON string with quotes
//       parsedContent = JSON.parse(rawContent.replace(/^\`+|\`+$/g, ""));
//     }

//     finalHTML += parsedContent.html || "";
//     finalCSS += parsedContent.css || "";
//     finalJS += parsedContent.js || "";
//   }

//   return { html: finalHTML, css: finalCSS, js: finalJS };
// }


import OpenAI from "openai";
import dotenv from "dotenv";
import { encoding_for_model } from "tiktoken";
import { log } from "console";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const geminiClient = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
})
async function lastChecking(html,css,js,mysite,sendLog){
console.log("\n\nLast checking started");
sendLog("Last checking started");
  const systemPrompt=`
  
  You are an expert frontend engineer.Your work is to check the code if any mistake and make it right without changing the design dont write less code.
  check only if there is any problem in the code add the snippet also user send only body add <!DOCTYPE html> in the code. link styles.css
  dont change the url of images and icons remaing part remains as it or enhace also but iclude all code

  OUTPUT FORMAT:
  { "html":<!Doctype html><html>...</html>, "css": "body { ... }", "js": "console.log('Hello, world!');" }
    RULES:
    - Strictly follow the output JSON format
   
    - Alway make sure to do multiple steps of thinking before giving out output.
    - Only include the snippet the user requested.
    - If user says "Navbar like Amazon", fetch only the Amazon Navbar block.
    - Always ensure CSS selectors and JS match the chosen HTML snippet.
    - Do not include unrelated inspiration blocks 
    - Please make sure that it make full site of one page. not that large but it should be full site.
    in html link css name styles.css and in js link js name script.js
    - Output must be valid JSON only.
- Use double quotes (") for all keys and string values.
- Do not use single quotes (') or string concatenation (+) or backticks.
- Escape all newlines inside strings as \n.
- Do not include comments inside the JSON.
- Always return exactly this format:
  { html: "...", css: "...", js: "..." }

  HTML Chunk:
  ${html}
  CSS Chunk:
  ${css}
  JS Chunk:
  ${js}
  Mysite:
  ${mysite}
  check the content from my site
`
const response = await client.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: systemPrompt }],
});
sendLog("Working on your code");
const rawContent = response.choices[0].message.content;
console.log("\n finishing the code checking");

let parsedContent;
try {
  parsedContent = JSON.parse(rawContent);
  sendLog("done wait few seconds")
} catch {
  // fallback: sometimes rawContent is already JSON string with quotes
  parsedContent = JSON.parse(rawContent.replace(/^\`+|\`+$/g, ""));
}
return parsedContent


}
// helper: count tokens
function countTokens(text) {
  const enc = encoding_for_model("gpt-4"); // closest tokenizer
  return enc.encode(text).length;
}

// chunk HTML/CSS/JS only (query + mysite always included)
function chunkCode(html, css, js, query, mysite, maxTokensPerRequest = 6000) {
  const baseTokens = countTokens(`Query:\n${query}\nMysite:\n${mysite}\n`);
  const availableTokens = maxTokensPerRequest - (baseTokens + 800); // keep buffer

  // combine code
  const fullCode = `HTML:\n${html}\nCSS:\n${css}\nJS:\n${js}`;
  const codeTokens = countTokens(fullCode);

  if (codeTokens <= availableTokens) return [fullCode]; // all in one

  // chunk code into multiple parts
  const enc = encoding_for_model("gpt-4");
  const tokens = enc.encode(fullCode);
  const chunks = [];
  for (let i = 0; i < tokens.length; i += availableTokens) {
    const slice = tokens.slice(i, i + availableTokens);
    chunks.push(enc.decode(slice));
  }
  return chunks;
}
function normalizeOutput(parsedContent) {
  if (!parsedContent || parsedContent.step !== "OUTPUT") {
    return { html: "<!-- no output -->", css: "/* empty */", js: "// empty" };
  }

  const raw = parsedContent.content;

  return {
    html: raw.html || "<!-- no html -->",
    css: raw.css || "/* no css */",
    js: raw.js || "// no js",
  };
}


function cleanJSON(str) {
  // Remove ```json or ``` wrappers
  let cleaned = str.replace(/```json|```/gi, "").trim();

  // Keep only the first valid JSON block
  const firstCurly = cleaned.indexOf("{");
  const lastCurly = cleaned.lastIndexOf("}");
  if (firstCurly !== -1 && lastCurly !== -1) {
    cleaned = cleaned.substring(firstCurly, lastCurly + 1);
  }

  return cleaned;
}
function safeParseAI(rawContent) {
  // remove code fences or backticks
  let cleaned = rawContent.replace(/```json|```/gi, "").trim();

  // find first valid JSON block
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON found in AI response");

  return JSON.parse(match[0]);
}

async function filterAIWorker(obj,sendLog) {
  const systemPrompt = `
  You are a JavaScript expert.
  Check the ${obj} and return a valid JSON output format.
  OUTPUT FORMAT:
  {
    "html": "<!DOCTYPE html><html>...</html>",
    "css": "body { ... }",
    "js": "console.log('Hello, world!');"
  }
  `;

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: obj }
    ],
  });

  let rawContent = res.choices[0].message.content.trim();
  let parsedContent;

  try {
    sendLog("Working on your code");
    console.log("Working on your code");

    // Remove code fences if present
    rawContent = rawContent.replace(/```json|```/g, "").trim();

    // Extract JSON substring if extra text surrounds it
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      rawContent = jsonMatch[0];
    }

    parsedContent = JSON.parse(rawContent);
    sendLog("Parsing is done");
    console.log("Parsing is done");
  } catch (err) {
    console.error("Parsing failed:", err.message);
    parsedContent = { error: "Invalid JSON returned", raw: rawContent };
  }

  return parsedContent;
}

export async function frontendWorker(query, mysite, html,css,js,sendLog) {
let finalHtml = "";
let finalCss = "";
let finalJs = "";

  const codeChunks = chunkCode(html, css, js, query, mysite, 6000);
 
  

  for (const chunk of codeChunks) {
    const systemPrompt =
    `
     You are an expert Frontend Developer who works on START, THINK and OUTPUT format.
     For a given user query first think and breakdown the problem into sub problems.
     You should always keep thinking and thinking before giving the actual output strictly follow output JSON format strictly.

      Also, before output the final result to user you must check once if everything is correct.
     Task: 
     
 -Given a user query,giving inspiration HTML/CSS/JS code in chunks,ser’s site content ("mysite"), you must tailor the inspiration design to the user’s site.
 - Identify the correct snippet from the commented inspirations in chunks evey section has comment which site they are related to
 - Extract that snippet and clean it (remove comments).
 - Merge it with the user’s provided code if given.
 -provide very high quality code like add what you want in the code
 - if url of images given use url as same as given but if it is stored in local path that image should we in  folder name called assets and image name should be same as given
 - if url of css given use url as same as given but if it is stored in local path that css should we in css folder and css name should be same as given
 -if the url of icons given use as it is if stored locally that icon should be in public folder and icon name should be same as given
  - contain nextjs url in users site use as it is add responsive ness also to the site
          Rules:
    - Strictly follow the output JSON format
    - Always follow the output in sequence that is START, THINK, OBSERVE and OUTPUT.
    - Always perform only one step at a time and wait for other step.
    - Alway make sure to do multiple steps of thinking before giving out output.
    - For every tool call always wait for the OBSERVE which contains the output from tool
    - please i dont this type of rr in output Expected ',' or '}' after property value in JSON at position 1514 (line 1 column 1515) 
    -use '' inside code not return like this {"html":"("")"} i want content like this {"html":"''"}
    - dont add symbol in output like + / /n and backticks backslash backslash n in the code output
    - i dont want this err ',' or '}' after property value in JSON at position 1508 (line 1 column 1509)
    Output JSON Format:
    { "step": "START | THINK | OUTPUT | OBSERVE" , "content": "string" }


- Always ensure CSS selectors and JS match the chosen HTML snippet.
userSite: { "html":<!Doctype html><html>...</html>, "css": "body { ... }", "js": "console.log('Hello, world!');" }
     Input: format
     { "query":"User Query" ,userSite: "<!Doctype html><html>...</html> css js", chunks:"chunks that contain html css js"  }
     Example:
     User: Hey could you please read this code and make it better using the same design and content?
     ASSISTANT: { "step": "START", "content": "The user wants me to combine the html css js code and made it according to user query and he wants to tailored data according to his site" }

     ASSISTANT: { "step": "THINK", "content": "Let me analyze the user query"" } 
     ASSISTANT: { "step": "OBSERVE", "content": "Let me analyze the data of user site" }
     ASSISTANT: { "step": "THINK", "content": "Now i am analyzing the chunk of code that you gave me" }
     ASSISTANT: { "step": "OBSERVE", "content": "Now user want that i have to grab parts of code according to query" }
     ASSISTANT: { "step": "THINK", "content": "now make html acc to the html code and tailored the content acc to site that you give me and name it index.html"}
     ASSISTANT: { "step": "OBSERVE", "content": "the task of images and icons and the html code that you gave me" }
     ASSISTANT: { "step": "THINK", "content": "now make images and svg url as rules said"}   
    ASSISTANT: { "step": "OBSERVE", "content": "let me check the css code that use gave me" }
     ASSISTANT: { "step": "THINK", "content": "now make css acc to the html code if their is tailwind or any other convert them in css working file acc to user site maintain selectors also so that css works store it in css and provide htmlcode link to style.css and based on the design of css that you give me and name it style.css" }
     ASSISTANT: { "step": "OBSERVE", "content": "let me check the js code that you gave me" }
     ASSISTANT: { "step": "THINK", "content": "now make js acc to the html code" }
     ASSISTANT: { "step": "THINK", "content": "if any thing is missing u dont find it from html css js please make it by your own so htat its looks"}
     ASSISTANT: { "step": "THINK", "content": "Great i got the code now link them all" }
     ASSISTANT: { "step": "OBSERVE", "content": "observe the user site content again" }
     ASSISTANT: { "step": "THINK", "content": "add more section in user site if needed also style and script iwant complete site like 4 to 5 sections acc to user site" }
     ASSISTANT: { "step": "THINK", "content": "follow all the RULES than produce output" }
     ASSISTANT: { "step": "OUTPUT", "content": "{"html":"<!Doctype html><html>...</html>", "css": "body { ... }", "js": "console.log('Hello, world!');}" }
   ;

     `
   ;

    const messages = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `{
        "query": "${query}",
        "userSite": ${JSON.stringify(mysite)},
        "chunks": "${chunk}"
        }`

      },
    ];

     while (true) {
      const response = await client.chat.completions.create({
        model: "gpt-4.1-mini",
        messages,
      });

      const rawContent = response.choices[0].message.content;

      let parsedContent;
      try {
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        parsedContent = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent);
      } catch (err) {
        console.error("❌ Failed to parse JSON:", rawContent);
        break;
      }

      // log steps
      if (parsedContent.step === "START") {
        sendLog("🔥"+ parsedContent.content)
        console.log("🔥",parsedContent.content)
      }
      if (parsedContent.step === "THINK") {
        console.log("🧠", parsedContent.content);
        sendLog("🧠"+ parsedContent.content)
      }
      if (parsedContent.step === "OBSERVE") {
        console.log("👀", parsedContent.content);
        sendLog("👀"+ parsedContent.content)
      }

     if (parsedContent.step === "OUTPUT") {
      sendLog("🎉 Fixing the code")
      console.log("\n\n🎉 Fixing the code");
      
      const res = await filterAIWorker(parsedContent.content,sendLog);
      finalHtml += res.html;
      finalCss += res.css;
      finalJs += res.js;
  break;
}



messages.push({ role: "assistant", content: JSON.stringify(parsedContent) });

    }
  }



     const checked = await lastChecking(finalHtml,finalCss,finalJs,mysite,sendLog);
     
     
return { html: checked.html, css: checked.css, js: checked.js };

}
