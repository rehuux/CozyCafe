const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, updateUser, SHOP_ITEMS } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('buy')
        .setDescription('🛒 Buy an item from the shop')
        .addStringOption(option =>
            option.setName('item')
                .setDescription('Item to buy')
                .setRequired(true)
                .addChoices(
                    SHOP_ITEMS.map(item => ({
                        name: item.name,
                        value: item.id
                    }))
                )
        ),

    async execute(interaction) {
        try {
            const itemId = interaction.options.getString('item');
            const item = SHOP_ITEMS.find(i => i.id === itemId);

            if (!item) {
                return interaction.reply({
                    content: '❌ Item not found.',
                    ephemeral: true
                });
            }

            const user = await getUser(interaction.user.id);

            if (user.coins < item.cost) {
                return interaction.reply({
                    content: `❌ You need **${item.cost}** coins. You have ${user.coins}.`,
                    ephemeral: true
                });
            }

            const newCoins = user.coins - item.cost;
            const inventory = user.inventory || [];
            inventory.push(itemId);

            await updateUser(interaction.user.id, {
                coins: newCoins,
                inventory: inventory
            });

            const embed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('🛒 Purchase Successful!')
                .setDescription(`You bought **${item.name}**!`)
                .addFields(
                    { name: 'Cost', value: `${item.cost} coins`, inline: true },
                    { name: 'Remaining', value: `${newCoins} coins`, inline: true }
                )
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
