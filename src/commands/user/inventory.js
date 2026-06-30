const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, SHOP_ITEMS } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inventory')
        .setDescription('🎒 View your inventory'),

    async execute(interaction) {
        try {
            const user = await getUser(interaction.user.id);
            const inventory = user.inventory || [];

            if (inventory.length === 0) {
                return interaction.reply({
                    content: '🎒 Your inventory is empty. Visit the shop with `/shop`!',
                    ephemeral: true
                });
            }

            const items = inventory.map(id => {
                const item = SHOP_ITEMS.find(i => i.id === id);
                return item ? `• ${item.name} — ${item.description}` : `• Unknown item (${id})`;
            });

            const embed = new EmbedBuilder()
                .setColor(0xc5774a)
                .setTitle(`🎒 ${interaction.user.username}'s Inventory`)
                .setDescription(items.join('\n'))
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: '❌ Something went wrong.',
                ephemeral: true
            });
        }
    }
};
