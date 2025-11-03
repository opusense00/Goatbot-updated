const axios = require('axios');
const { getStreamFromURL } = global.utils;
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

module.exports = {
  config: {
    name: "fastx2",
    version: "1.0",
    author: "Redwan",
    countDown: 20,
    longDescription: {
      en: "Generate AI images quickly using Fastx (Redwan's API)."
    },
    category: "ai",
    role: 0,
    guide: {
      en: "{pn} <prompt>"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const prompt = args.join(' ').trim();
    if (!prompt) return message.reply("⚠️ Please provide a prompt to generate the image.");

    api.setMessageReaction("⌛", event.messageID, () => {}, true);
    message.reply("⚡ Fastx is generating your images. Please wait...", async () => {
      try {
        // ✅ Fastx API
        const apiUrl = `http://65.109.80.126:20511/api/fastx?prompt=${encodeURIComponent(prompt)}`;
        const response = await axios.get(apiUrl);

        if (!response?.data?.status || !Array.isArray(response.data.images) || response.data.images.length !== 4) {
          api.setMessageReaction("❌", event.messageID, () => {}, true);
          return message.reply("❌ Image generation failed. Try a different prompt.");
        }

        const imageLinks = response.data.images;
        const imageObjs = await Promise.all(imageLinks.map(url => loadImage(url)));

        const canvas = createCanvas(1024, 1024);
        const ctx = canvas.getContext('2d');

        ctx.drawImage(imageObjs[0], 0, 0, 512, 512);
        ctx.drawImage(imageObjs[1], 512, 0, 512, 512);
        ctx.drawImage(imageObjs[2], 0, 512, 512, 512);
        ctx.drawImage(imageObjs[3], 512, 512, 512, 512);

        const cacheDir = path.join(__dirname, 'cache');
        fs.mkdirSync(cacheDir, { recursive: true });

        const fileName = `fastx_collage_${event.senderID}_${Date.now()}.png`;
        const outputPath = path.join(cacheDir, fileName);

        const out = fs.createWriteStream(outputPath);
        const stream = canvas.createPNGStream();
        stream.pipe(out);

        out.on("finish", async () => {
          api.setMessageReaction("✅", event.messageID, () => {}, true);
          const msg = {
            body: "✅ Fastx image is ready!\n\n❏ Reply with U1, U2, U3, or U4 to choose one.",
            attachment: fs.createReadStream(outputPath)
          };
          message.reply(msg, (err, info) => {
            if (!err) {
              global.GoatBot.onReply.set(info.messageID, {
                commandName: this.config.name,
                messageID: info.messageID,
                author: event.senderID,
                images: imageLinks
              });
            }
          });
        });

      } catch (error) {
        console.error(error);
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        message.reply("🚫 An error occurred while generating the image. Try again later.");
      }
    });
  },

  onReply: async function ({ api, event, Reply, message }) {
    const { author, images } = Reply;
    if (event.senderID !== author) {
      return message.reply("⚠️ Only the person who started the command can select an image.");
    }

    const input = event.body.trim().toUpperCase();
    const match = input.match(/^U([1-4])$/);
    if (!match) {
      return message.reply("❌ Invalid input. Reply with U1, U2, U3, or U4.");
    }

    const index = parseInt(match[1]) - 1;
    const selectedImage = images[index];

    try {
      const imageStream = await getStreamFromURL(selectedImage, `fastx_selected_U${index + 1}.jpg`);
      message.reply({
        body: `🖼️ Here is your selected image (U${index + 1}) from Fastx.`,
        attachment: imageStream
      });
    } catch (error) {
      console.error(error);
      message.reply("🚫 Could not fetch the selected image. Please try again.");
    }
  }
};
