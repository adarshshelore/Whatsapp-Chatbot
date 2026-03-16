require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");

const webhookRoutes = require("./routes/webhook");

const app = express();
app.use((req, res, next) => {
  console.log("➡️ Request received:", req.method, req.originalUrl);
  next();
});
app.use(bodyParser.json());

// app.use("/webhook", console.log("hi"));
app.use("/webhook", webhookRoutes);

app.get("/", (req, res) => {
  res.send("WhatsApp Bot Running ✅");
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
