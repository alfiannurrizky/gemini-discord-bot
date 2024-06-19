import { Client, GatewayIntentBits } from "discord.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { fileToGenerativePart } from "./fileToGenerativePart.js";
import { downloadImage } from "./downloadImage.js";
import { fileURLToPath } from "url";
import { logger } from "./utils/logger.js";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildVoiceStates,
    ],
  });

  client.login(process.env.DISCORD_API_KEY);

  client.on("ready", () => {
    logger.info(`${client.user.username} login!`);
  });

  function splitMessage(text, maxLength = 2000) {
    const chunks = [];
    for (let i = 0; i < text.length; i += maxLength) {
      chunks.push(text.substring(i, i + maxLength));
    }
    return chunks;
  }

  client.on("messageCreate", async (message) => {
    if (
      message.attachments.size > 0 &&
      message.content.startsWith("/ask-img")
    ) {
      const attachment = message.attachments.first();
      const imageUrl = attachment.url;
      const imageName = `img-${Date.now()}.png`;
      const imagePath = path.join(__dirname, "images", imageName);

      try {
        await downloadImage(imageUrl, imagePath);
        logger.info(`Gambar telah diunduh: ${imagePath}`);

        const imageParts = [fileToGenerativePart(imagePath, "image/png")];

        const result = await model.generateContent([
          message.content,
          ...imageParts,
        ]);
        const response = await result.response;
        const text = await response.text();

        const chunks = splitMessage(text);
        for (const chunk of chunks) {
          await message.reply(chunk);
        }
        logger.info(
          `AI berhasil menjawab pertanyaan ${message.author.displayName}`
        );

        message.reply(
          `Semoga jawaban nya membuat kamu puas ya ${message.author.displayName} 😊`
        );
      } catch (error) {
        logger.error(`Ada error: ${error.message}`);
        message.reply(
          "Terjadi kesalahan saat memproses permintaan Anda, silahkan coba lagi!"
        );
      }
    } else if (message.content.startsWith("/ask")) {
      try {
        const result = await model.generateContent(message.content);
        const response = await result.response;
        const text = await response.text();

        const chunks = splitMessage(text);
        for (const chunk of chunks) {
          await message.reply(chunk);
        }
        logger.info(
          `AI berhasil menjawab pertanyaan ${message.author.displayName}`
        );

        message.reply(
          `Semoga jawaban nya membuat kamu puas ya ${message.author.displayName} 😊`
        );
      } catch (error) {
        logger.error(`Ada error: ${error.message}`);
        message.reply(
          `Terjadi kesalahan saat memproses permintaan Anda, silahkan coba lagi!`
        );
      }
    }
  });

  client.on("error", (error) => {
    logger.error("Ada kesalahan di client:", error);
  });
}

run();
