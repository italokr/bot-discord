const { DateTime } = require("luxon");

// 🔥 memória das mensagens por canal
const lastMessages = new Map();

module.exports = async (message) => {

  // 🔥 apagar mensagem do usuário
  await message.delete().catch(() => {});

  // 🔥 apagar mensagem anterior do bot
const lastMessageId = lastMessages.get(message.channel.id);

if (lastMessageId) {
  try {
    const oldMsg = await message.channel.messages.fetch(lastMessageId);
    await oldMsg.delete();
  } catch {}
}

  const SERVER_TZ = "America/Sao_Paulo";

  const events = [
    { name: "MZ", times: ["19:00","22:00","02:00","08:00","13:00","16:00"] },
    { name: "GL", times: ["20:00","14:00","17:00", "01:00"] },
    { name: "TF", times: ["21:00","04:00","10:00","15:00","18:00"] },
    { name: "SG", times: ["17:30","20:30","23:30","02:30","05:30","08:30","11:30","14:30"] }
  ];

  const now = DateTime.now().setZone(SERVER_TZ);

  let allUpcoming = [];

  // Expandir todos os horários
  for (const event of events) {
    for (const t of event.times) {

      const [hour, minute] = t.split(":");

      let eventTime = DateTime.fromObject({
  year: now.year,
  month: now.month,
  day: now.day,
  hour: parseInt(hour),
  minute: parseInt(minute),
  second: 0
}, { zone: SERVER_TZ });

      // Se já passou hoje → joga pra amanhã
      if (eventTime < now) {
        eventTime = eventTime.plus({ days: 1 });
      }

      allUpcoming.push({
        name: event.name,
        time: eventTime
      });
    }
  }

  let next2Hours = allUpcoming.filter(e => {
  const diff = e.time.toMillis() - now.toMillis();
  return diff > 0 && diff <= 120 * 60 * 1000;
});

// 🔥 fallback: se não tiver nada nas próximas 2h
if (next2Hours.length === 0) {
  next2Hours = allUpcoming
    .filter(e => e.time.toMillis() > now.toMillis())
    .sort((a, b) => a.time.toMillis() - b.time.toMillis())
    .slice(0, 3);
}
next2Hours.sort((a, b) => a.time.toMillis() - b.time.toMillis());
  
  let response;

if (next2Hours.length === 0) {
  response = "❌ Nenhum evento nas próximas 2 horas.";
} else {
  response = "📅 **Eventos nas próximas 2 horas:**\n\n";

  next2Hours.forEach(e => {
  const unix = Math.floor(e.time.toSeconds());
  response += `• **${e.name}** → <t:${unix}:R> (<t:${unix}:t>)\n`;
});
}

const sentMsg = await message.channel.send(response);
lastMessages.set(message.channel.id, sentMsg.id);
};