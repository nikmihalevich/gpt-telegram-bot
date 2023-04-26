import { Telegraf, session } from 'telegraf';
import { message } from 'telegraf/filters';
import { code } from 'telegraf/format';
import config from 'config';
import { ogg } from './ogg.js';
import { openai } from './openai.js';
import { removeFile } from './utils.js';
import { initCommand, processTextToChat, processTextToImage, INITIAL_SESSION } from './logic.js';

const bot = new Telegraf(
	config.get('TELEGRAM_TOKEN') ? config.get('TELEGRAM_TOKEN') : process.env.TELEGRAM_TOKEN,
);

bot.use(session());

bot.command('new', initCommand);

bot.command('start', initCommand);

bot.command('chatting', async (ctx) => {
	ctx.session.painting = false;
	await ctx.reply('Жду вашего голосового или текстового сообщения');
});

bot.command('painting', async (ctx) => {
	ctx.session.painting = true;
	await ctx.reply('Жду вашего голосового или текстового сообщения');
});

bot.on(message('voice'), async (ctx) => {
	ctx.session ??= INITIAL_SESSION;
	try {
		await ctx.reply(code('Сообщение принял. Жду ответ от сервера...'));

		const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id); // link.href
		const userId = String(ctx.message.from.id);
		const oggPath = await ogg.create(link.href, userId);
		const mp3Path = await ogg.toMp3(oggPath, userId);

		removeFile(oggPath);

		const text = await openai.transcription(mp3Path);

		removeFile(mp3Path);

		await ctx.reply(code(`Ваш запрос: ${text}`));

		if (ctx.session.painting) {
			await processTextToImage(ctx, text);
		} else {
			await processTextToChat(ctx, text);
		}
	} catch (e) {
		console.log('Error while voice message', e.message);
	}
});

bot.on(message('text'), async (ctx) => {
	ctx.session ??= INITIAL_SESSION;
	try {
		await ctx.reply(code('Сообщение принял. Жду ответ от сервера...'));

		if (ctx.session.painting) {
			await processTextToImage(ctx, ctx.message.text);
		} else {
			await processTextToChat(ctx, ctx.message.text);
		}
	} catch (e) {
		console.log('Error while voice message', e.message);
	}
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
