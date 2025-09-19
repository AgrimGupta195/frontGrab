// wsClientTest.js
import WebSocket from "ws";

const ws = new WebSocket("ws://localhost:5050");

ws.on("open", () => {
  console.log("✅ Connected to WebSocket server");
});

ws.on("message", (data) => {
  console.log(data.toString());
});

ws.on("close", () => {
  console.log("❌ Disconnected from WebSocket server");
});
