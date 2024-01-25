import { Bot, InlineKeyboard, webhookCallback } from "grammy";
import { chunk } from "lodash";
import express from "express";


// Create a bot using the Telegram token
const bot = new Bot(process.env.TELEGRAM_TOKEN || "");


// Suggest commands in the menu
bot.api.setMyCommands([
    { command: "info", description: "Learn more about Sanic The Hedgehog." },
    { command: "sanickart", description: "Play the Sanic Kart Open Beta." },
    { command: "sanicdeathmatch", description: "Sanic Deathmatch is coming soon!" },
    { command: "saniccomic", description: "Sanic Comic is coming soon!" },
    { command: "future", description: "Keep checking back for updates on the Sanicverse." },
]);

// Handle all other messages and the /start command
const introductionMessage = `Hello! I am Sanic AI - I can help you navigate the Sanicverse.

<b>Commands</b>
/info - Learn more about Sanic The Hedgehog
/sanickart - Play the Sanic Kart Open Beta: https://sanickart.sanicthehedgehog.com
/sanicdeathmatch - Sanic Deathmatch is coming soon!
/saniccomic - Sanic Comic is coming soon!
/future - Keep checking back for updates on the Sanicverse.`;

const replyWithIntro = (ctx: any) =>
    ctx.reply(introductionMessage, {
        reply_markup: {
            inline_keyboard: aboutUrlKeyboard.inline_keyboard,
        },
        parse_mode: "HTML",
    });

bot.command("start", replyWithIntro);
bot.on("message", replyWithIntro);

// Start the server
if (process.env.NODE_ENV === "production") {
    // Use Webhooks for the production server
    const app = express();
    app.use(express.json());
    app.use(webhookCallback(bot, "express"));

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Bot listening on port ${PORT}`);
    });
} else {
    // Use Long Polling for development
    bot.start();
}
