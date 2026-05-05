const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const data = require('./data.json');

async function sendRules(channel) {
  let message;

  const embed = new EmbedBuilder()
    .setTitle('📜 Regras Unknown')
    .setColor(0x5865F2)
    .setDescription(`
━━━━━━━━━━━━━━━━━━━━━━━
🇧🇷 **REGRAS DA GUILD**
━━━━━━━━━━━━━━━━━━━━━━━

**1. Respeito e Conduta**
• Não serão tolerados insultos, provocações ou discussões nos chats da guilda.
• Resolva conflitos via DM ou abra um ticket explicando a situação.
• O descumprimento resultará em advertência ou banimento, conforme gravidade e reincidência.

━━━━━━━━━━━━━━━━━━━━━━━

**2. Hierarquia**
• Respeite líderes e oficiais.
• Callers são definidos por mérito e experiência — não por tempo de guilda.

━━━━━━━━━━━━━━━━━━━━━━━

**3. Atividade**
• A participação em TF não é obrigatória, porém é essencial para desbloquear bônus de guilda e bosses.
• Membros inativos podem ser removidos caso haja necessidade de vaga para jogadores ativos.

━━━━━━━━━━━━━━━━━━━━━━━

⚔️ **PvP**
• Siga sempre o caller.
• Evite ações individuais — o jogo em equipe é fundamental.

🐉 **PvE**
• KS não será tolerado.
• Evite conflitos — tente dialogar ou trocar de respawn.
• Caso não haja resolução, abra um ticket.

🛡️ **Geral**
• Utilize os canais corretos para cada assunto.
• Não é permitido flood, spam ou conteúdo NSFW.

━━━━━━━━━━━━━━━━━━━━━━━
━━━━━━━━━━━━━━━━━━━━━━━
🇬🇧 **GUILD RULES**
━━━━━━━━━━━━━━━━━━━━━━━

**1. Respect & Conduct**
• Insults, harassment, or arguments in guild chats will not be tolerated.
• Resolve conflicts via DM or open a ticket explaining the situation.
• Violations may result in warnings or bans depending on severity and recurrence.

━━━━━━━━━━━━━━━━━━━━━━━

**2. Hierarchy**
• Respect leaders and officers.
• Callers are chosen based on merit and experience — not guild time.

━━━━━━━━━━━━━━━━━━━━━━━

**3. Activity**
• Participation in TF is not mandatory, but it is required to unlock guild bonuses and bosses.
• Inactive members may be removed if space is needed for active players.

━━━━━━━━━━━━━━━━━━━━━━━

⚔️ **PvP**
• Always follow the caller.
• Avoid solo actions — teamwork is essential.

🐉 **PvE**
• KS will not be tolerated.
• Avoid conflicts — communicate or change respawn if needed.
• If unresolved, open a ticket.

🛡️ **General**
• Use the appropriate channels for each topic.
• No spam, flooding, or NSFW content.

━━━━━━━━━━━━━━━━━━━━━━━

    `);

  if (data.rulesMessageId) {
    try {
      message = await channel.messages.fetch(data.rulesMessageId);
      await message.edit({ embeds: [embed] });
      console.log('↺ Atualizado');
      return;
    } catch {}
  }

  message = await channel.send({ embeds: [embed] });

  data.rulesMessageId = message.id;
  fs.writeFileSync('./data.json', JSON.stringify(data, null, 2));

  console.log('✔ Criado');
}

module.exports = { sendRules };