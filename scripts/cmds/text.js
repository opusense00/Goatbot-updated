const fs = require("fs");
const path = require("path");

// Node.js v16+ compatible fetch
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = {
  config: { 
    name: "text", 
    version: "1.3", 
    author: "Muzan", 
    role: 2 
  },

  onStart: async ({ message, args, event }) => {
    const serverBase = "https://share-1-10dh.onrender.com"; // তোমার server URL
    let content;

    try {
      // CASE 1: reply করা মেসেজ থেকে
      if (event.messageReply && event.messageReply.body) {
        content = event.messageReply.body;
      }
      // CASE 2: args দিয়ে
      else if (args.length > 0) {
        const input = args.join(" ");

        // যদি .js বা .txt ফাইল দেওয়া হয়
        if (input.endsWith(".js") || input.endsWith(".txt")) {
          const filePath = path.join(__dirname, input);
          if (!fs.existsSync(filePath)) {
            return message.reply(`❌ ফাইল পাওয়া যায়নি: ${input}`);
          }
          content = fs.readFileSync(filePath, "utf8");
        } else {
          content = input; // normal text
        }
      } else {
        return message.reply("❌ কিছু লিখুন, ফাইল নাম দিন, অথবা reply করুন।");
      }

      // Server এ পাঠানো
      const response = await fetch(`${serverBase}/api/text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content })
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Server Response:", text);
        return message.reply(`❌ সার্ভার থেকে error এসেছে: ${response.status}`);
      }

      const data = await response.json();
      if (!data.rawId) return message.reply("❌ টেক্সট তৈরি করতে সমস্যা হয়েছে।");

      const link = `${serverBase}/link/${data.rawId}`;
      message.reply(`✅ সফলভাবে আপলোড হয়েছে:\n${link}`);

    } catch (err) {
      console.error("Error:", err);
      message.reply(`❌ সার্ভার বা কোডে error হয়েছে: ${err.message}`);
    }
  }
};
