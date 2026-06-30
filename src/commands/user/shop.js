const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { SHOP_ITEMS } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('🛒 View the café shop'),

    async execute(interaction) {
        let description = '';
        SHOP_ITEMS.forEach(item => {
            description += `**${item.name}** — ${item.cost} coins\n`;
            description += `> ${item.description}\n\n`;
        });

        const embed = new EmbedBuilder()
            .setColor(0xc5774a)
            .setTitle('☕ Café Shop')
            .setDescription(description)
            .setFooter({ text: 'Use /buy <item> to purchase' });

        await interaction.reply({ embeds: [embed] });
    }
};
