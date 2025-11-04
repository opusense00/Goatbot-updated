const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "finder",
    version: "1.0",
    author: "TXc",
    countDown: 5,
    role: 2, // Admin/Owner only
    shortDescription: "Find which command files contain a specific text or emoji",
    longDescription: "Searches all command files and lists which contain the specified text or emoji",
    category: "owner",
    guide: {
      en: "{p}finder <keyword>"
    }
  },

  onStart: async function({ message, args }) {
    const keyword = args.join(" ").trim();
    if (!keyword) return message.reply("❌ | Please provide a keyword or emoji to search for.");

    const cmdsPath = path.join(__dirname);
    const files = fs.readdirSync(cmdsPath).filter(f => f.endsWith(".js"));

    let results = [];

    for (const file of files) {
      try {
        const filePath = path.join(cmdsPath, file);
        const content = fs.readFileSync(filePath, "utf8");

        if (content.includes(keyword)) {
          let cmdName = file;
          const match = content.match(/name:\s*["'`](.*?)["'`]/);
          if (match) cmdName = match[1];

          results.push(`${file} → ${cmdName}`);
        }
      } catch (e) {
        console.error(`Error reading ${file}:`, e);
      }
    }

    if (results.length === 0)
      return message.reply(`❌ | No command files contain the keyword "${keyword}".`);

    const msg = `🔍 | Commands containing "${keyword}":\n\n${results.join("\n")}`;
    message.reply(msg.slice(0, 20000));
  }
};
