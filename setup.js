const fs = require('fs');
const data = require('./data.json');

const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  ChannelType,
  EmbedBuilder
} = require('discord.js');
const { sendRules } = require('./sendRules');

const TOKEN = process.env.TOKEN;
const GUILD_ID = '1498695437727567962';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

async function getOrCreateChannel(guild, name, type, parent = null) {
  let channel = guild.channels.cache.find(
    c => c.name === name && c.type === type
  );

  if (!channel) {
    channel = await guild.channels.create({
      name,
      type,
      parent: parent?.id || null
    });
    console.log(`✔ Canal criado: ${name}`);
  } else {
    console.log(`↺ Canal já existe: ${name}`);
  }

  return channel;
}

// util: delay p/ evitar rate limit
const wait = (ms) => new Promise(r => setTimeout(r, ms));

async function getOrCreateRole(guild, name, options = {}) {
  let role = guild.roles.cache.find(r => r.name === name);
  
  if (!role) {
    role = await guild.roles.create({
      name,
      color: options.color || 0x000000,
      permissions: options.permissions || []
    });
    console.log(`✔ Cargo criado: ${name}`);
  } else {
    console.log(`↺ Cargo já existe: ${name}`);
  }
  
  return role;
}

client.once('ready', async () => {
  console.log(`Logado como ${client.user.tag}`);

  const guild = await client.guilds.fetch(GUILD_ID);

  const canalRules = await getOrCreateChannel(
    guild,
    'rules',
    ChannelType.GuildText
  );

  await sendRules(canalRules);

  // =========================
  // 🧹 (OPCIONAL) LIMPEZA
  // =========================
  // cuidado: descomente se quiser limpar tudo
  /*
  for (const [, ch] of guild.channels.cache) {
    await ch.delete().catch(() => {});
    await wait(300);
  }
  for (const [, role] of guild.roles.cache) {
    if (!role.managed && role.name !== '@everyone') {
      await role.delete().catch(() => {});
      await wait(300);
    }
  }
  */

  // =========================
  // 🎭 CARGOS (ordem = hierarquia)
  // =========================
  // criamos de baixo para cima e depois ajustamos posição
  const roles = {};

  roles.visitante = await getOrCreateRole(guild, 'Visitante', {
    color: 0x95a5a6
  });

  roles.membro = await getOrCreateRole(guild, 'Membro', {
    color: 0xffffff
  });

  roles.oficial = await getOrCreateRole(guild, 'Oficial', {
    color: 0x3498db,
    permissions: [
      PermissionsBitField.Flags.KickMembers,
      PermissionsBitField.Flags.ManageMessages,
      PermissionsBitField.Flags.MuteMembers,
      PermissionsBitField.Flags.MoveMembers
    ]
  });

  roles.lider = await getOrCreateRole(guild, 'Líder', {
    color: 0xe67e22,
    permissions: [
      PermissionsBitField.Flags.ManageGuild,
      PermissionsBitField.Flags.ManageChannels,
      PermissionsBitField.Flags.ManageRoles
    ]
  });

  roles.conselho = await getOrCreateRole(guild, 'Conselho', {
    color: 0x9b59b6,
    permissions: [PermissionsBitField.Flags.Administrator]
  });
  // ajustar posições (topo maior número)
  await guild.roles.setPositions([
    { role: roles.conselho.id, position: 6 },
    { role: roles.lider.id, position: 5 },
    { role: roles.oficial.id, position: 4 },
    { role: roles.membro.id, position: 3 },
    { role: roles.visitante.id, position: 2 }
  ]);

  // =========================
  // 🔐 PERMISSÕES BASE
  // =========================
  // @everyone sem acesso a tudo por padrão
  const everyone = guild.roles.everyone;

  // helper p/ criar categoria + canais
  async function criarCategoria(nome, canais, overwrites = []) {
    const categoria = await guild.channels.create({
      name: nome,
      type: ChannelType.GuildCategory,
      permissionOverwrites: overwrites
    });
    await wait(400);

    for (const c of canais) {
      await guild.channels.create({
        name: c.nome,
        type: c.tipo,
        parent: categoria.id,
        permissionOverwrites: c.overwrites || []
      });
      await wait(300);
    }
  }

  // =========================
  // 🔒 VERIFICAÇÃO
  // =========================
  await criarCategoria('🔒 VERIFICAÇÃO', [
    {
      nome: 'rules',
      tipo: ChannelType.GuildText
    },
    {
      nome: 'verificação',
      tipo: ChannelType.GuildText
    }
  ], [
    { id: everyone.id, deny: [PermissionsBitField.Flags.SendMessages] }
  ]);

  // =========================
  // 📢 INFORMAÇÕES
  // =========================
  await criarCategoria('📢 INFORMAÇÕES', [
    { nome: 'anúncios', tipo: ChannelType.GuildText },
    { nome: 'calendário-raids', tipo: ChannelType.GuildText },
    { nome: 'guias-builds', tipo: ChannelType.GuildText }
  ], [
    { id: everyone.id, deny: [PermissionsBitField.Flags.SendMessages] },
    { id: roles.oficial.id, allow: [PermissionsBitField.Flags.SendMessages] },
    { id: roles.lider.id, allow: [PermissionsBitField.Flags.SendMessages] }
  ]);

  // =========================
  // 🧭 RECRUTAMENTO
  // =========================
  await criarCategoria('🧭 RECRUTAMENTO', [
    { nome: 'recrutamento', tipo: ChannelType.GuildText },
    { nome: 'aplicação', tipo: ChannelType.GuildText }
  ]);

  // =========================
  // 💬 CHAT
  // =========================
  await criarCategoria('💬 CHAT', [
    { nome: 'geral', tipo: ChannelType.GuildText },
    { nome: 'off-topic', tipo: ChannelType.GuildText },
    { nome: 'memes', tipo: ChannelType.GuildText }
  ]);

  // =========================
  // ⚔️ ATIVIDADES (PvP/PvE)
  // =========================
  await criarCategoria('⚔️ ATIVIDADES', [
    { nome: 'lobby', tipo: ChannelType.GuildVoice },
    { nome: 'raid-1', tipo: ChannelType.GuildVoice },
    { nome: 'raid-2', tipo: ChannelType.GuildVoice },
    { nome: 'estratégias', tipo: ChannelType.GuildText }
  ]);

  // =========================
  // 🛠️ SUPORTE
  // =========================
  await criarCategoria('🛠️ SUPORTE', [
    { nome: 'suporte', tipo: ChannelType.GuildText }
  ]);

  // =========================
  // 👑 STAFF (privado)
  // =========================
  await criarCategoria('👑 STAFF', [
    { nome: 'staff-chat', tipo: ChannelType.GuildText },
    { nome: 'logs', tipo: ChannelType.GuildText }
  ], [
    { id: everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
    { id: roles.oficial.id, allow: [PermissionsBitField.Flags.ViewChannel] },
    { id: roles.lider.id, allow: [PermissionsBitField.Flags.ViewChannel] },
    { id: roles.conselho.id, allow: [PermissionsBitField.Flags.ViewChannel] }
  ]);

  console.log('✅ Servidor configurado em nível profissional');
});

// Evento para enviar mensagem de boas-vindas quando um novo membro entra
client.on('guildMemberAdd', async (member) => {
  try {
    const guild = member.guild;
    
    // Encontrar o canal de recrutamento
    const canalRecrutamento = guild.channels.cache.find(
      c => c.name === 'recrutamento' && c.type === ChannelType.GuildText
    );
    
    if (!canalRecrutamento) {
      console.log('Canal de recrutamento não encontrado');
      return;
    }
    
    // Criar o embed de boas-vindas
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('👋 Bem-vindo à Unknown')
      .setDescription(`
🎮 Bem-vindo ${member.user}!

📜 Leia as regras em #rules  
🎯 Pegue sua classe em #take-your-class  
⚔️ Aguarde recrutamento  
👥 Fale com um Oficial se precisar  
      `)
      .setThumbnail(member.user.displayAvatarURL())
      .setFooter({ text: 'Unknown - Guild Management System' })
      .setTimestamp();
    
    // Enviar a mensagem
    await canalRecrutamento.send({ embeds: [embed] });
    console.log(`✔ Mensagem de boas-vindas enviada para ${member.user.tag}`);
  } catch (error) {
    console.error('Erro ao enviar mensagem de boas-vindas:', error);
  }
});

client.login(TOKEN);
