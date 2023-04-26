import { openai } from './openai.js';

export const INITIAL_SESSION = {
	messages: [],
	painting: false,
};

export async function initCommand(ctx) {
	ctx.session = INITIAL_SESSION;
	await ctx.reply('Жду вашего голосового или текстового сообщения');
}

export async function processTextToChat(ctx, content) {
	try {
		ctx.session.messages.push({ role: openai.roles.USER, content });

		const response = await openai.chat(ctx.session.messages);

		ctx.session.messages.push({
			role: openai.roles.ASSISTANT,
			content: response.content,
		});

		await ctx.reply(response.content);
	} catch (e) {
		console.log('Error while proccesing text to gpt', e.message);
	}
}

export async function processTextToImage(ctx, content) {
	try {
		const imgLink = await openai.paint(content);

		await ctx.replyWithPhoto(imgLink);
	} catch (e) {
		console.log('Error while proccesing text to gpt', e.message);
	}
}
