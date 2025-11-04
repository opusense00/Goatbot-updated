module.exports = {
  config: {
    name: "craw",
    aliases: [],
    version: "1.1",
    author: "Muzan",
    countDown: 5,
    role: 0,
    shortDescription: "Convert link to raw",
    longDescription: "Reply to a link and convert it into raw link format (only pure link)",
    category: "tools",
    guide: "{pn} (reply to a link or use *craw <link>)"
  },

  onStart: async function ({ message, event, args }) {
    let text = "";

    if (args[0]) {
      text = args[0]; // direct *craw <link>
    } else if (event.messageReply && event.messageReply.body) {
      // reply হলে শুধু লিঙ্ক extract করবো
      let match = event.messageReply.body.match(/https?:\/\/\S+/);
      if (match) text = match[0];
    }

    if (!text) {
      return message.reply("❌ | Please reply to a valid link or use *craw <link>");
    }

    if (!text.includes("/link/")) {
      return message.reply("❌ | This is not a valid link.");
    }

    // raw=true add করা
    let rawLink = text.includes("?raw=true") ? text : text + "?raw=true";

    message.reply(`✅ | Raw link:\n${rawLink}`);
  }
};
