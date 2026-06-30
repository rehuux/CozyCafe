const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, updateUser } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('collect')
        .setDescription('💰 Collect your café earnings!'),

    async execute(interaction) {
        try {
            const user = await getUser(interaction.user.id);
            
            const lastCollect = new Date(user.last_collect || Date.now());
            const now = new Date();
            const hours = (now - lastCollect) / (1000 * 60 * 60);
            
            const earned = Math.floor(hours * 5);
            
            if (earned < 1) {
                return interaction.reply({
                    content: '☕ Your café is still brewing! Check back in an hour.',
                    ephemeral: true
                });
            }

            const newCoins = user.coins + earned;

            await updateUser(interaction.user.id, {
                coins: newCoins,
                total_earned: (user.total_earned || 0) + earned,
                last_collect: now.toISOString()
            });

            const embed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('💰 Earnings Collected!')
                .setDescription(`☕ Your café earned **${earned}** coins!`)
                .addFields(
                    { name: 'New Balance', value: `${newCoins} coins`, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: '❌ Something went wrong. Please try again.',
                ephemeral: true
            });
        }
    }
};
