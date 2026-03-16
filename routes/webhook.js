const express = require("express");
const router = express.Router();
const sendMessage = require("../services/whatsapp");

// ─── Helper: send interactive button message ────────────────────────────────
async function sendButtons(to, bodyText, buttons) {
  // buttons = [{ id: "btn_1", title: "Courses" }, ...]
  // Max 3 buttons per message (WhatsApp limit)
  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: bodyText },
      action: {
        buttons: buttons.map((btn) => ({
          type: "reply",
          reply: {
            id: btn.id,
            title: btn.title, // Max 20 characters
          },
        })),
      },
    },
  };
  return sendMessage(to, null, payload); // pass raw payload
}

// ─── Helper: send plain text message ────────────────────────────────────────
async function sendText(to, text) {
  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: text },
  };
  return sendMessage(to, null, payload);
}

// ─── Main menu ───────────────────────────────────────────────────────────────
async function sendMainMenu(to) {
  // WhatsApp only allows 3 buttons per message
  // So we split into 2 messages: 3 buttons + 1 button
  await sendButtons(
    to,
    "👋 Welcome to *Disha Computer Institute*\n\nHow can we help you today?",
    [
      { id: "btn_courses",   title: "📘 Courses" },
      { id: "btn_fees",      title: "💰 Fees" },
      { id: "btn_demo",      title: "📅 Demo Class" },
    ]
  );
  // Send 4th option as a separate button message
  await sendButtons(
    to,
    "More options:",
    [
      { id: "btn_counselor", title: "👨‍🏫 Talk to Counselor" },
    ]
  );
}

// ─── GET /webhook — Meta verification ───────────────────────────────────────
router.get("/", (req, res) => {
  console.log("🟡 GET /webhook — verification request");
  const mode      = req.query["hub.mode"];
  const token     = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  console.log(mode, token, challenge);
  console.log(process.env.VERIFY_TOKEN);
  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    console.log("✅ Webhook verified");
    return res.status(200).send(challenge);
  }
  console.log("❌ Webhook verification failed");
  return res.sendStatus(403);
});

// ─── POST /webhook — incoming messages ──────────────────────────────────────
router.post("/", async (req, res) => {
  console.log("🔥 POST /webhook received");
  console.dir(req.body, { depth: null });

  // Always respond 200 immediately so Meta doesn't retry
  res.sendStatus(200);

  const entry   = req.body.entry?.[0];
  const changes = entry?.changes?.[0];
  const value   = changes?.value;

  // ── Handle interactive button replies ─────────────────────────────────────
  const interactiveMsg = value?.messages?.[0];
  if (interactiveMsg?.type === "interactive") {
    const buttonId    = interactiveMsg.interactive?.button_reply?.id;
    const buttonTitle = interactiveMsg.interactive?.button_reply?.title;
    const from        = interactiveMsg.from;
    console.log(`🖱️  Button tapped: id="${buttonId}" title="${buttonTitle}" from=${from}`);

    switch (buttonId) {
      case "btn_courses":
        await sendButtons(
          from,
          "📘 *Our Courses:*\n\n• Basic Computer\n• Programming (Python, C, C++)\n• Tally with GST\n• Data Analytics\n• Web Development\n• MS Office\n\nWant details about any course?",
          [
            { id: "btn_fees",      title: "💰 Check Fees" },
            { id: "btn_demo",      title: "📅 Book Demo" },
            { id: "btn_main_menu", title: "🏠 Main Menu" },
          ]
        );
        break;

      case "btn_fees":
        await sendButtons(
          from,
          "💰 *Course Fees:*\n\n• Basic Computer: ₹3,000\n• Programming: ₹8,000\n• Tally with GST: ₹5,000\n• Data Analytics: ₹10,000\n• Web Development: ₹12,000\n• MS Office: ₹2,500\n\n_EMI options available_",
          [
            { id: "btn_demo",      title: "📅 Book Demo" },
            { id: "btn_counselor", title: "👨‍🏫 Counselor" },
            { id: "btn_main_menu", title: "🏠 Main Menu" },
          ]
        );
        break;

      case "btn_demo":
        await sendButtons(
          from,
          "📅 *Book a Free Demo Class!*\n\nDemo classes are available:\n🕐 Mon–Sat: 10AM – 6PM\n📍 Visit our institute or join online\n\nClick below to confirm:",
          [
            { id: "btn_confirm_demo", title: "✅ Confirm Demo" },
            { id: "btn_counselor",    title: "👨‍🏫 Talk to Us" },
            { id: "btn_main_menu",    title: "🏠 Main Menu" },
          ]
        );
        break;

      case "btn_confirm_demo":
        await sendText(
          from,
          "🎉 *Demo class booked!*\n\nOur team will call you within 24 hours to confirm the time.\n\nThank you for choosing *Disha Computer Institute*! 🙏"
        );
        // Notify admin
        await sendText(
          "919049058315",
          `📌 *New Demo Booking*\nFrom: +${from}\nAction: Confirmed demo class request`
        );
        break;

      case "btn_counselor":
        await sendText(
          from,
          "👨‍🏫 *Connecting you to a counselor...*\n\nOur counselor will contact you shortly on this number.\n\nOffice hours: Mon–Sat, 10AM – 6PM 🕐"
        );
        // Notify admin
        await sendText(
          "919049058315",
          `📌 *Counselor Request*\nFrom: +${from}\nAction: Wants to talk to counselor`
        );
        break;

      case "btn_main_menu":
        await sendMainMenu(from);
        break;

      default:
        console.log(`⚠️  Unknown button id: ${buttonId}`);
        await sendMainMenu(from);
    }

    return;
  }

  // ── Handle regular text messages ──────────────────────────────────────────
  const textMsg = value?.messages?.[0];
  if (textMsg?.type === "text") {
    const from = textMsg.from;
    
    const text = textMsg.text?.body?.toLowerCase().trim();

    console.log(`💬 Text message from ${from}: "${text}"`);

    // If user types anything, show the main menu with buttons
    await sendMainMenu(from);
    return;
  }

  console.log("ℹ️  No actionable message found in payload");
});

module.exports = router;