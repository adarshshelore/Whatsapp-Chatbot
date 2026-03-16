// services/whatsapp.js
const axios = require("axios");

const GRAPH_URL = "https://graph.facebook.com/v19.0";
const PHONE_ID  = process.env.PHONE_NUMBER_ID;   // your Phone Number ID
const TOKEN     = process.env.WHATSAPP_TOKEN;       // system user access token

/**
 * sendMessage(to, text, rawPayload)
 *
 * Usage:
 *   sendMessage(to, "Hello!")               → plain text
 *   sendMessage(to, null, { ...payload })   → raw payload (interactive buttons etc.)
 */
async function sendMessage(to, text, rawPayload = null) {
  try {
    const body = rawPayload
      ? rawPayload  // use the raw payload directly (interactive, template, etc.)
      : {
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: text },
        };

    console.log(`[API] Sending message to ${to} — type: ${body.type}`);

    const response = await axios.post(
      `${GRAPH_URL}/${PHONE_ID}/messages`,
      body,
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`[API] ✅ Message sent — ID: ${response.data?.messages?.[0]?.id}`);
    return response.data;

  } catch (error) {
    console.error("[API] ❌ Failed to send message:");
    console.error(error.response?.data || error.message);
    throw error;
  }
}

module.exports = sendMessage;