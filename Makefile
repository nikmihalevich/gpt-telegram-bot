build:
	docker build -t gpt-telegram-bot .

run:
	docker run -d -p 3000:3000 --name gpt-tgbot --rm gpt-telegram-bot