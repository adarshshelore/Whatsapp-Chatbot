const express = require("express");
const router = express.Router();
const sendMessage = require("../services/whatsapp");

// Verification (Meta calls this)
router.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// Incoming messages
router.post("/", async (req, res) => {
  const entry = req.body.entry?.[0];
  const changes = entry?.changes?.[0];
  const message = changes?.value?.messages?.[0];

  if (!message) return res.sendStatus(200);

  const from = message.from;
  const text = message.text?.body?.toLowerCase();

  let reply =
    "Hello 👋 Welcome to *Disha Computer Institute*\n\n" +
    "Reply with:\n" +
    "1️⃣ Courses\n" +
    "2️⃣ Fees\n" +
    "3️⃣ Demo Class\n" +
    "4️⃣ Talk to Counselor";

  if (text === "1") reply = "📘 Courses:\n• Programming\n• Tally\n• Data Analytics\n• Web Development";
  if (text === "2") reply = "💰 Fees depend on course. Reply with COURSE NAME.";
  if (text === "3") reply = "📅 Demo class available. Reply DEMO to book.";
  if (text === "4") reply = "👨‍🏫 Our counselor will contact you shortly.";

  await sendMessage(from, reply);
  res.sendStatus(200);
});

module.exports = router;
