const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cafe')
        .setDescription('☕ Check in on your café'),

    async execute(interaction) {
        try {
            const user = await getUser(interaction.user.id);

            const embed = new EmbedBuilder()
                .setColor(0xc5774a)
                .setTitle(`☕ ${interaction.user.username}'s Café`)
                .addFields(
                    { name: '💰 Coins', value: `${user.coins}`, inline: true },
                    { name: '📊 Level', value: `${user.level}`, inline: true },
                    { name: '📈 Streak', value: `${user.streak || 0} days`, inline: true }
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
