const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  Events,
  ComponentType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const Canvas = require("canvas");
const fs = require("fs");
const path = require("path");
const https = require("https");
const config = require("./config.json");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const invites = new Map();

client.guilds.cache.forEach(async (guild) => {
  try {
    const firstInvites = await guild.invites.fetch();
    invites.set(
      guild.id,
      new Map(firstInvites.map((invite) => [invite.code, invite.uses]))
    );
  } catch (error) {
    console.error(`Error fetching invites for guild ${guild.id}:`, error);
  }
});

const eventFiles = [];
client.once("ready", () => {
  console.clear();
  const line = "─".repeat(50);
  console.log(line);
  console.log(`🌐 ${client.user.tag} is now online!`);
  console.log(line);
  console.log(`🤖 Bot Username  : ${client.user.username}`);
  console.log(`🆔 Bot ID        : ${client.user.id}`);
  console.log(`📅 Launched On   : ${new Date().toLocaleString()}`);
  console.log(line);
  console.log(`📊 Connected to  : ${client.guilds.cache.size} servers`);
  console.log(`👥 Total Users   : ${client.users.cache.size}`);
  console.log(`📁 Loaded Events : ${eventFiles.length || "N/A"}`);
  console.log(line);
  console.log(`© 2024 wickstudio - All Rights Reserved.`);
  console.log(`🔗 GitHub: https://github.com/wickstudio`);
  console.log(`🌐 YouTube: https://www.youtube.com/@wick_studio`);
  console.log(`💬 Discord: https://discord.gg/wicks`);
  console.log(line);
  console.log("✅ Bot is fully operational and ready to serve!");
  console.log(line);

  loadServerSettings();
});

const increment = 10; 

function getDefaultSettings() {
  return {
    avatarX: 350,
    avatarY: 125,
    textX: 350,
    textY: 200,
    welcomeText: 'اهلا وسهلا {name}',
    avatarSize: 100,
    fontSize: 36,
    textColor: '#ffffff',
    avatarShape: 'circle',
    welcomeChannelId: null,
    autoRoleId: null,
    useNickname: false
  };
}

function createImagePositionButtons() {
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('up')
                .setLabel('⬆️')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('down')
                .setLabel('⬇️')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('left')
                .setLabel('⬅️')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('right')
                .setLabel('➡️')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('done')
                .setLabel('تم ✅')
                .setStyle(ButtonStyle.Success)
        );
    return row;
}

function createAvatarShapeButtons() {
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('avatar_circle')
                .setLabel('شكل دائري 🔵')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('avatar_square')
                .setLabel('شكل مربع ◻️')
                .setStyle(ButtonStyle.Secondary)
        );
    return row;
}

function createImageSizeButtons() {
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('increase_avatar')
                .setLabel('كبر الصورة 🔍+')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('decrease_avatar')
                .setLabel('صغر الصورة 🔍-')
                .setStyle(ButtonStyle.Secondary)
        );
    return row;
}

function createTextPositionButtons() {
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('text_up')
                .setLabel('⬆️')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('text_down')
                .setLabel('⬇️')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('text_left')
                .setLabel('⬅️')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('text_right')
                .setLabel('➡️')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('finish')
                .setLabel('تم ✅')
                .setStyle(ButtonStyle.Success)
        );
    return row;
}

function createTextControlButtons() {
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('increase_text')
                .setLabel('كبر النص 📝+')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('decrease_text')
                .setLabel('صغر النص 📝-')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('change_text')
                .setLabel('غير النص 📝')
                .setStyle(ButtonStyle.Secondary)
        );
    return row;
}

const SETTINGS_FILE = path.join(__dirname, 'settings.json');

let serverSettings = {};
let setupState = new Map();

function loadServerSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
      serverSettings = JSON.parse(data);
      console.log('Settings loaded successfully');
    } else {
      serverSettings = {};
      saveSettings();
      console.log('New settings file created');
    }
  } catch (err) {
    console.error('Error loading settings:', err);
    serverSettings = {};
  }
}

function saveSettings() {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(serverSettings, null, 2));
    console.log('Settings saved successfully');
  } catch (err) {
    console.error('Error saving settings:', err);
  }
}

client.on('messageCreate', async (message) => {
    if (message.content === `${config.prefix}cancelsetup`) {
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('عذرا، هذا الامر للادمن بس.');
        }
        
        const guildId = message.guild.id;
        const settings = serverSettings[guildId];
        
        if (!settings || !setupState.get(guildId)) {
            return message.reply('مافيه اعداد شغال حاليا.');
        }
        
        if (settings.setupUserId && settings.setupUserId !== message.author.id) {
            return message.reply('راعي الامر يمديه يتحكم بالازرار لا تدخل');
        }
        
        setupState.delete(guildId);
        await message.reply(`تم الغاء الاعداد. تقدر تبدأ من جديد بالامر \`${config.prefix}setup\``);
        return;
    }

    if (message.content !== `${config.prefix}setup` || !message.member.permissions.has('Administrator')) return;

    try {
        const settings = serverSettings[message.guild.id] || getDefaultSettings();

        setupState.set(message.guild.id, 'CHOOSING_AVATAR_SHAPE');
        settings.setupUserId = message.author.id;

        const setupMsg = await message.channel.send({
            content: '**اختيار شكل صورة العضو:**\nاختر الشكل اللي تفضله للصورة',
            components: [createAvatarShapeButtons()]
        });

        settings.setupMessageId = setupMsg.id;
        serverSettings[message.guild.id] = settings;
        saveSettings();
    } catch (err) {
        console.error('Error in setup process:', err);
        message.channel.send('صار خطأ في الاعداد. حاول مرة ثانية.');
    }
});

client.on('interactionCreate', async (interaction) => {
   if (!interaction.isButton()) return;

   try {
       const settings = serverSettings[interaction.guild.id];
       if (!settings || interaction.message.id !== settings.setupMessageId) return;

       if (settings.setupUserId && settings.setupUserId !== interaction.user.id) {
           await interaction.reply({ 
               content: 'معليش فقط الشخص اللي بدا الامر الاعداد يقدر يستخدم هالازرار.', 
               ephemeral: true 
           });
           return;
       }

       const state = setupState.get(interaction.guild.id);

       if (state === 'CHOOSING_AVATAR_SHAPE') {
           if (interaction.customId === 'avatar_circle') {
               settings.avatarShape = 'circle';
           } else if (interaction.customId === 'avatar_square') {
               settings.avatarShape = 'square';
           }

           const canvas = await createWelcomeImage(interaction.member, settings);
           const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'welcome.png' });

           await interaction.update({
               content: '**تعديل الصورة:**\nحدد مكان وحجم صورة العضو',
               files: [attachment],
               components: [createImagePositionButtons(), createImageSizeButtons()]
           });

           setupState.set(interaction.guild.id, 'EDITING_IMAGE');
           saveSettings();
           return;
       }
 
       settings.avatarSize = settings.avatarSize || 100;
       settings.fontSize = settings.fontSize || 36;

       switch (interaction.customId) {
           case 'up':
               settings.avatarY -= increment;
               break;
           case 'down':
               settings.avatarY += increment;
               break;
           case 'left':
               settings.avatarX -= increment;
               break;
           case 'right':
               settings.avatarX += increment;
               break;
 
           case 'text_up':
               settings.textY -= increment;
               break;
           case 'text_down':
               settings.textY += increment;
               break;
           case 'text_left':
               settings.textX -= increment;
               break;
           case 'text_right':
               settings.textX += increment;
               break;
 
           case 'increase_avatar':
               settings.avatarSize = Math.min((settings.avatarSize || 100) + 50, 600);
               break;
           case 'decrease_avatar':
               settings.avatarSize = Math.max((settings.avatarSize || 100) - 50, 50);
               break;
           case 'increase_text':
               settings.fontSize = Math.min((settings.fontSize || 36) + 10, 150);
               break;
           case 'decrease_text':
               settings.fontSize = Math.max((settings.fontSize || 36) - 10, 20);
               break;
           case 'change_text':
               const modal = new ModalBuilder()
                   .setCustomId('welcome_text_modal')
                   .setTitle('تعديل نص الترحيب');

               const welcomeTextInput = new TextInputBuilder()
                   .setCustomId('welcomeTextInput')
                   .setLabel('اكتب النص (استخدم {name} مكان اسم العضو)')
                   .setStyle(TextInputStyle.Paragraph)
                   .setValue(settings.welcomeText || 'مرحبا {name}')
                   .setPlaceholder('مثال: يا هلا بـ {name} في سيرفرنا')
                   .setRequired(true)
                   .setMaxLength(200);

               const firstActionRow = new ActionRowBuilder().addComponents(welcomeTextInput);
               modal.addComponents(firstActionRow);

               await interaction.showModal(modal);
               return;
 
           case 'done':
               if (state === 'EDITING_IMAGE') {
                   setupState.set(interaction.guild.id, 'EDITING_TEXT');
                   
                   const canvas = await createWelcomeImage(interaction.member, settings);
                   const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'welcome.png' });
                   
                   await interaction.update({
                       content: '**تعديل النص:**\nحدد مكان وحجم النص',
                       files: [attachment],
                       components: [createTextPositionButtons(), createTextControlButtons()]
                   });
                   return;
               }
               break;
               
           case 'finish':
               if (state === 'EDITING_TEXT') {
                   setupState.set(interaction.guild.id, 'AWAITING_WELCOME_CHANNEL');
                   
                   await interaction.update({
                       content: '**تم الانتهاء من تعديل الصورة والنص**\nالآن منشن شات الترحيب (مثل كذا: #welcome)',
                       files: [], 
                       components: []
                   });
                   return;
               }
               break;
       }

       const canvas = await createWelcomeImage(interaction.member, settings);
       const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'welcome.png' });
 
       const components = state === 'EDITING_TEXT' 
           ? [createTextPositionButtons(), createTextControlButtons()]
           : [createImagePositionButtons(), createImageSizeButtons()];
 
       await interaction.update({
           files: [attachment],
           components: components
       });
 
       saveSettings();
   } catch (err) {
       console.error('خطا في معالجة التفاعل:', err);
       await interaction.reply({ content: 'حدث خطا. الرجاء المحاولة مرة أخرى.', ephemeral: true });
   }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const guildId = message.guild.id;
  const state = setupState.get(guildId);
  const settings = serverSettings[guildId];

  if (!state || !settings) return;
  
  if (settings.setupUserId && settings.setupUserId !== message.author.id) return;

  try {
    if (state === 'AWAITING_WELCOME_CHANNEL') {
      const channel = message.mentions.channels.first();
      if (channel) {
        settings.welcomeChannelId = channel.id;
        setupState.set(guildId, 'AWAITING_ROLE');
        saveSettings();
        await message.channel.send('تم اختيار الشات الحين منشن الرتبة اللي تبي تنعطي للاعضاء الجدد (@role)');
      } else {
        await message.channel.send('منشن شات صحيحة (#channel)');
      }
      return;
    }

    if (state === 'AWAITING_ROLE') {
      const role = message.mentions.roles.first();
      if (role) {
        settings.autoRoleId = role.id;
        setupState.delete(guildId);
        saveSettings();
        await message.channel.send({
          content: '🎉 تم الإعداد بنجاح**\n' +
  `
              **معلومات النظام:**
              • قناة الترحيب: <#${settings.welcomeChannelId}>
              • الرتبة التلقائية: <@&${settings.autoRoleId}>
              
              الحين البوت راح يرحب بالاعضاء الجدد ويعطيهم رتبه تلقائي.
              اذا حاب تغير الاعدادات او المقاسات استخدم \`${config.prefix}setup\` مرة ثانية.
            `
        });
      } else {
        await message.channel.send('منشن رتبة صحيحة (@role)');
      }
    }
  } catch (err) {
    console.error('Error processing channel/role:', err);
    await message.channel.send(`صار خطا. حاول مرة ثانية بالامر ${config.prefix}setup`);
  }
});

client.on('guildMemberAdd', async (member) => {
  try {
    let settings = serverSettings[member.guild.id];
    if (!settings || !settings.welcomeChannelId) return;

    let welcomeChannel = member.guild.channels.cache.get(settings.welcomeChannelId);
    if (!welcomeChannel) return;

    let newInvites = await member.guild.invites.fetch();
    let oldInvites = invites.get(member.guild.id) || new Map();
    
    let inviter = 'Unknown';
    let invite = newInvites.find(inv => inv.uses > (oldInvites.get(inv.code) || 0));
    
    if (invite && invite.inviter) {
      inviter = `<@${invite.inviter.id}>`;
    }
    
    let memberMention = `<@${member.id}>`;
    let canvas = await createWelcomeImage(member, settings);
    let attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'welcome.png' });
    
    await welcomeChannel.send({
      content: `**Welcome Server ${memberMention}**\n**Invite by ${inviter} **`,
      files: [attachment]
    });

    if (settings.autoRoleId) {
      await member.roles.add(settings.autoRoleId);
    }
  } catch (err) {
    console.error('خطا في معالجة العضو الجديد:', err);
  }
});

async function downloadImage(url, guildId) {
  return new Promise((resolve, reject) => {
    const folderPath = path.join(__dirname, 'backgrounds');
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);
    }

    const fileName = path.join(folderPath, `bg_${guildId}.png`);
    const file = fs.createWriteStream(fileName);

    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(fileName);
      });
    }).on('error', reject);
  });
}

client.on('messageCreate', async (message) => {
  if (!message.content.startsWith(`${config.prefix}setbg`)) return;
  if (!message.member.permissions.has('Administrator')) {
    return message.reply('عذرا، هذا الامر للادمن بس.');
  }

  const settings = serverSettings[message.guild.id] || {
    ...getDefaultSettings()
  };

  try {
    const attachment = message.attachments.first();
    if (!attachment) {
      return message.reply(`ارفق صورة مع الامر ${config.prefix}setbg`);
    }

    if (!attachment.contentType?.startsWith('image/')) {
      return message.reply('ارفق صورة صحيحه بصيغة (PNG, JPG)');
    }

    const backgroundPath = await downloadImage(attachment.url, message.guild.id);
    
    settings.backgroundUrl = backgroundPath;
    serverSettings[message.guild.id] = settings;
    saveSettings();

    const canvas = await createWelcomeImage(message.member, settings);
    const preview = new AttachmentBuilder(canvas.toBuffer(), { name: 'welcome_preview.png' });

    await message.reply({
      content: 'تم تغيير الخلفية شوف شكل الترحيب:',
      files: [preview]
    });

  } catch (err) {
    console.error('Error setting background image:', err);
    await message.reply('صار خطا في تغيير الخلفية. حاول مره ثانية.');
  }
});

async function createWelcomeImage(member, settings) {
   const MAX_WIDTH = 1400;
   const MAX_HEIGHT = 800;
   
   let backgroundImage;
   try {
     if (settings.backgroundUrl) {
       backgroundImage = await Canvas.loadImage(settings.backgroundUrl);
     }
   } catch (err) {
     console.error('خطا في تحميل صورة الخلفية:', err);
   }

   let canvasWidth, canvasHeight;
   
   if (backgroundImage) {
     const ratio = Math.min(
       MAX_WIDTH / backgroundImage.width,
       MAX_HEIGHT / backgroundImage.height
     );
     
     canvasWidth = Math.round(backgroundImage.width * ratio);
     canvasHeight = Math.round(backgroundImage.height * ratio);
   } else {
     canvasWidth = MAX_WIDTH;
     canvasHeight = MAX_HEIGHT;
   }

   const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);
   const ctx = canvas.getContext('2d');

   ctx.quality = 'best';
   ctx.antialias = 'subpixel';

   try {
     if (backgroundImage) {
       ctx.drawImage(backgroundImage, 0, 0, canvasWidth, canvasHeight);
     } else {
       const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
       gradient.addColorStop(0, '#5BA3FF');
       gradient.addColorStop(1, '#FF9ECD');
       ctx.fillStyle = gradient;
       ctx.fillRect(0, 0, canvasWidth, canvasHeight);
     }

     ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
     ctx.fillRect(0, 0, canvasWidth, canvasHeight);

     const avatar = await Canvas.loadImage(
       member.user.displayAvatarURL({ 
         extension: 'png', 
         size: 512
       })
     );

     const avatarSize = settings.avatarSize || 100;
     const halfSize = avatarSize / 2;
     
     const avatarX = settings.avatarX || (canvasWidth / 2);
     const avatarY = settings.avatarY || (canvasHeight / 2);
     
     ctx.save();
   
     if (settings.avatarShape === 'circle') {
       ctx.beginPath();
       ctx.arc(avatarX, avatarY, halfSize, 0, Math.PI * 2);
       ctx.clip();
     } else if (settings.avatarShape === 'square') {
       ctx.beginPath();
       ctx.rect(avatarX - halfSize, avatarY - halfSize, avatarSize, avatarSize);
       ctx.clip();
     }

     ctx.drawImage(
       avatar,
       avatarX - halfSize,
       avatarY - halfSize,
       avatarSize,
       avatarSize
     );
     ctx.restore();

     if (settings.avatarShape === 'circle') {
       ctx.beginPath();
       ctx.arc(avatarX, avatarY, halfSize, 0, Math.PI * 2);
       ctx.strokeStyle = 'rgba(255,255,255,0.8)';
       ctx.lineWidth = canvasWidth * 0.006;
       ctx.stroke();
     } else if (settings.avatarShape === 'square') {
       ctx.beginPath();
       ctx.rect(avatarX - halfSize, avatarY - halfSize, avatarSize, avatarSize);
       ctx.strokeStyle = 'rgba(255,255,255,0.8)';
       ctx.lineWidth = canvasWidth * 0.006;
       ctx.stroke();
     }

     const fontSize = settings.fontSize || 36;
     ctx.font = `bold ${fontSize}px Arial`;
     ctx.textAlign = 'center';
     
     const welcomeText = settings.welcomeText?.replace('{name}', member.user.username) || `Welcome ${member.user.username}!`;
     
     const textX = settings.textX || (canvasWidth / 2);
     const textY = settings.textY || (canvasHeight * 0.8);

     ctx.shadowColor = 'rgba(0,0,0,0.4)';
     ctx.shadowBlur = fontSize * 0.15;
     ctx.shadowOffsetX = fontSize * 0.04;
     ctx.shadowOffsetY = fontSize * 0.04;

     ctx.strokeStyle = 'rgba(0,0,0,0.3)';
     ctx.lineWidth = fontSize * 0.08;
     ctx.strokeText(welcomeText, textX, textY);

     ctx.fillStyle = '#ffffff';
     ctx.fillText(welcomeText, textX, textY);

   } catch (err) {
     console.error('خطا في انشاء صورة الترحيب:', err);
     ctx.fillStyle = '#7289DA';
     ctx.fillRect(0, 0, canvasWidth, canvasHeight);
   }

   const outputRatio = Math.min(700 / canvasWidth, 400 / canvasHeight);
   const outputWidth = Math.round(canvasWidth * outputRatio);
   const outputHeight = Math.round(canvasHeight * outputRatio);
   
   const outputCanvas = Canvas.createCanvas(outputWidth, outputHeight);
   const outputCtx = outputCanvas.getContext('2d');
   
   outputCtx.imageSmoothingEnabled = true;
   outputCtx.imageSmoothingQuality = 'high';
   
   outputCtx.drawImage(canvas, 0, 0, canvasWidth, canvasHeight, 0, 0, outputWidth, outputHeight);

   return outputCanvas;
}

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isModalSubmit()) return;
    
    if (interaction.customId === 'welcome_text_modal') {
        try {
            const settings = serverSettings[interaction.guild.id];
            if (!settings) return;
            
            const newText = interaction.fields.getTextInputValue('welcomeTextInput');
            settings.welcomeText = newText;
            saveSettings();
            
            const canvas = await createWelcomeImage(interaction.member, settings);
            const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'welcome.png' });
            
            await interaction.reply({
                content: '**تم تغيير النص!**\nالحين تقدر تعدل مكان وحجم النص:',
                files: [attachment],
                components: [createTextPositionButtons(), createTextControlButtons()]
            });
            
            const replyMessage = await interaction.fetchReply();
            settings.setupMessageId = replyMessage.id;
            saveSettings();
            
        } catch (err) {
            console.error('Error processing modal submit:', err);
            await interaction.reply({ 
                content: 'صار خطا في تغيير النص. حاول مرة ثانية.', 
                ephemeral: true 
            });
        }
    }
});

process.on('uncaughtException', (error) => {
  console.error('Unhandled error:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

client.login(config.token);