import { Bot, InlineKeyboard, webhookCallback } from "grammy";
import { chunk } from "lodash";
import express from "express";
import { applyTextEffect, Variant } from "./textEffects";

import type { Variant as TextEffectVariant } from "./textEffects";

// Create a bot using the Telegram token
const bot = new Bot(process.env.TELEGRAM_TOKEN || "");

// Handle inline queries
const queryRegEx = /effect (monospace|bold|italic) (.*)/;
bot.inlineQuery(queryRegEx, async (ctx) => {
    const fullQuery = ctx.inlineQuery.query;
    const fullQueryMatch = fullQuery.match(queryRegEx);
    if (!fullQueryMatch) return;

    const effectLabel = fullQueryMatch[1];
    const originalText = fullQueryMatch[2];

    const effectCode = allEffects.find(
        (effect) => effect.label.toLowerCase() === effectLabel.toLowerCase()
    )?.code;
    const modifiedText = applyTextEffect(originalText, effectCode as Variant);

    await ctx.answerInlineQuery(
        [
            {
                type: "article",
                id: "text-effect",
                title: "Text Effects",
                input_message_content: {
                    message_text: `Original: ${originalText}
Modified: ${modifiedText}`,
                    parse_mode: "HTML",
                },
                reply_markup: new InlineKeyboard().switchInline("Share", fullQuery),
                url: "http://t.me/EludaDevSmarterBot",
                description: "Create stylish Unicode text, all within Telegram.",
            },
        ],
        { cache_time: 30 * 24 * 3600 } // one month in seconds
    );
});

// Return empty result list for other queries.
bot.on("inline_query", (ctx) => ctx.answerInlineQuery([]));

// Handle text effects from the effect keyboard
for (const effect of allEffects) {
    const allEffectCodes = allEffects.map((effect) => effect.code);

    bot.callbackQuery(effectCallbackCodeAccessor(effect.code), async (ctx) => {
        const { originalText } = parseTextEffectResponse(ctx.msg?.text || "");
        const modifiedText = applyTextEffect(originalText, effect.code);

        await ctx.editMessageText(
            textEffectResponseAccessor(originalText, modifiedText),
            {
                reply_markup: effectsKeyboardAccessor(
                    allEffectCodes.filter((code) => code !== effect.code)
                ),
            }
        );
    });
}

// Handle the /about command
const aboutUrlKeyboard = new InlineKeyboard().url(
    "Host your own bot for free.",
    "https://cyclic.sh"
);

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
