const Telegraf = require('telegraf');
const Markup = require("telegraf/markup");
const Stage = require("telegraf/stage");
const session = require("telegraf/session");
const WizardScene = require("telegraf/scenes/wizard");

const loveCalculator = require("./api/loveCalculator");
require('dotenv').config();
const token = process.env.BOT_TOKEN;
let bot;
//const bot = new Telegraf(process.env.BOT_TOKEN)
if (process.env.NODE_ENV === 'production') {
  bot = new Telegraf(token);
  //bot.setWebHook(process.env.HEROKU_URL + bot.token);
} else {
  bot = new Telegraf(token, { polling: true });
}

bot.start(ctx => {
  ctx.reply(
    `Salom ${ctx.from.first_name}, Sevgi kalkulyatorini sinab ko'rishni hoxlaysizmi?`,
    Markup.inlineKeyboard([
      Markup.callbackButton("Sevgi kalkulyatori", "LOVE_CALCULATE")
    ]).extra()
  );
});

const loveCalculate = new WizardScene(
  "love_calculate",
  ctx => {
    ctx.reply("Iltimos, ismingizni kiriting");
    return ctx.wizard.next();
  },
  ctx => {
    ctx.wizard.state.yourName = ctx.message.text;
    ctx.reply(
      "Yaxshi korgan insoningiz ismini kiriting va mosligingizni foyizlarda bilib oling."
    );
    return ctx.wizard.next();
  },
  ctx => {
    const partnerName = ctx.message.text;
    const yourName = ctx.wizard.state.yourName;
    loveCalculator
      .getPercentage(yourName, partnerName)
      .then(res => {
        const { fname, sname, percentage, result } = res.data;
        ctx.reply(
          `${fname} + ${sname} = ${percentage}% \n ${percentage > 50 ? '☺️' : '😢'} ${result}`,
          Markup.inlineKeyboard([
            Markup.callbackButton(
              "♥️ Boshqa insonda sinab korish",
              "LOVE_CALCULATE"
            )
          ]).extra()
        );
      })
      .catch(err => ctx.reply(
        err.message,
        Markup.inlineKeyboard([
          Markup.callbackButton("Yana urinib korish", "LOVE_CALCULATE")
        ]).extra()
      ));
    return ctx.scene.leave();
  }
);

const stage = new Stage([loveCalculate], { default: "love_calculate" });
bot.use(session());
bot.use(stage.middleware());
bot.launch();
