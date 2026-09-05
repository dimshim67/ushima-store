/**
 * U S H I M A. Apparel — Telegram Bot Auto-Setup & Start Handler
 * 
 * Данный скрипт:
 * 1. Автоматически устанавливает кнопку меню «Каталог U S H I M A. 🛍️» (Web App Menu Button)
 * 2. Автоматически ставит описание и инфо о боте в Telegram
 * 3. Отвечает на команду /start красивым сообщением и большой кнопкой «🛒 Открыть каталог U S H I M A.»
 * 
 * Запуск:
 * node scripts/start_bot.js <ВАШ_ТОКЕН_ОТ_BOTFATHER> [URL_САЙТА]
 */

const token = process.argv[2] || process.env.TELEGRAM_BOT_TOKEN;
const appUrl = process.argv[3] || process.env.APP_URL || 'https://ais-dev-tjevymwajofd32gs2fgjow-520097545568.europe-west2.run.app';

if (!token) {
  console.log(`
======================================================
 U S H I M A. — Telegram Bot Setup & Runner
======================================================
 Ошибка: не указан токен бота!
 
 Как запустить:
 1. Получите токен в Telegram у @BotFather (команда /newbot или /token)
 2. Запустите:
    node scripts/start_bot.js <ВАШ_ТОКЕН>

 Пример:
    node scripts/start_bot.js 1234567890:AAHxxxxxx...
======================================================
  `);
  process.exit(1);
}

const TG_API = `https://api.telegram.org/bot${token}`;

async function tgCall(method, body = {}) {
  try {
    const res = await fetch(`${TG_API}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error(`Ошибка запроса к Telegram API (${method}):`, err.message);
    return { ok: false, description: err.message };
  }
}

async function setupBot() {
  console.log(`\n Настройка бота U S H I M A....`);
  console.log(` URL приложения: ${appUrl}`);

  // 1. Проверяем токен
  const me = await tgCall('getMe');
  if (!me.ok) {
    console.error(`❌ Неверный токен бота: ${me.description}`);
    process.exit(1);
  }
  console.log(`✅ Бот подключен: @${me.result.username} (${me.result.first_name})`);

  // 2. Устанавливаем системную кнопку Menu Button (открывает сайт внизу экрана)
  console.log(` 1. Настройка постоянной кнопки «Каталог U S H I M A. 🛍️» (Menu Button)...`);
  const menuRes = await tgCall('setChatMenuButton', {
    menu_button: {
      type: 'web_app',
      text: 'Каталог U S H I M A. 🛍️',
      web_app: { url: appUrl }
    }
  });
  if (menuRes.ok) {
    console.log(`✅ Кнопка меню внизу чата успешно настроена!`);
  } else {
    console.log(`⚠️ Предупреждение:`, menuRes.description);
  }

  // 3. Устанавливаем описание бота (Description)
  console.log(` 2. Настройка описания бота (/setdescription)...`);
  await tgCall('setMyDescription', {
    description: `Официальный интернет-магазин авангардной одежды и мерча U S H I M A. 🖤\n\n• Актуальный каталог и размеры\n• Быстрый заказ прямо в Telegram\n• Доставка по всей России\n\nНажмите кнопку внизу или команду /start, чтобы открыть витрину.`
  });

  // 4. Устанавливаем краткое описание (About)
  console.log(` 3. Настройка профиля (/setabouttext)...`);
  await tgCall('setMyShortDescription', {
    short_description: `U S H I M A. — авангардная одежда и мерч. Каталог и онлайн-заказ в Telegram Mini App.`
  });

  console.log(`\n🎉 ОФОРМЛЕНИЕ И КНОПКИ БОТА УСПЕШНО НАСТРОЕНЫ!`);
  console.log(`-----------------------------------------------------`);
  console.log(`Теперь запустите бота в Telegram: https://t.me/${me.result.username}`);
  console.log(`Внизу экрана появится постоянная кнопка «Каталог U S H I M A. 🛍️».`);
  console.log(`Слушаю сообщения (Long Polling)... Нажмите Ctrl+C для выхода.`);
  console.log(`-----------------------------------------------------\n`);

  // Запуск Long Polling для ответа на /start
  pollUpdates(0);
}

async function pollUpdates(offset) {
  try {
    const res = await tgCall('getUpdates', { offset, timeout: 30 });
    if (res.ok && res.result && res.result.length > 0) {
      for (const update of res.result) {
        offset = update.update_id + 1;
        if (update.message && update.message.text) {
          await handleMessage(update.message);
        }
      }
    }
  } catch (e) {
    // игнорируем сетевые задержки
  }
  setTimeout(() => pollUpdates(offset), 1000);
}

async function handleMessage(msg) {
  const chatId = msg.chat.id;
  const text = msg.text || '';
  const userName = msg.from?.first_name || 'клиент';

  if (text.startsWith('/start')) {
    console.log(`📩 Получена команда /start от @${msg.from?.username || chatId} (${userName})`);

    const welcomeText = `Привет, ${userName}! 👋\n\nДобро пожаловать в официальный магазин авангардного бренда **U S H I M A.** 🖤\n\nЗдесь вы можете выбрать размеры, оформить заказ и примерить новинки прямо внутри Telegram.\n\n👇 **Нажмите на кнопку ниже, чтобы открыть каталог:**`;

    await tgCall('sendMessage', {
      chat_id: chatId,
      text: welcomeText,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🛒 Открыть каталог U S H I M A.',
              web_app: { url: appUrl }
            }
          ],
          [
            {
              text: '💬 Связаться с брендом',
              url: 'https://t.me/dimshim67'
            }
          ]
        ]
      }
    });
  }
}

setupBot();
