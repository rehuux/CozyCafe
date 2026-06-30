const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('open')
        .setDescription('☕ Open your very own café!'),

    async execute(interaction) {
        try {
            const user = await getUser(interaction.user.id);

            const embed = new EmbedBuilder()
                .setColor(0xc5774a)
                .setTitle('☕ Your café is open!')
                .setDescription(`Welcome to **${interaction.user.username}'s Café**!`)
                .addFields(
                    { name: '💰 Coins', value: `${user.coins}`, inline: true },
                    { name: '📊 Level', value: `${user.level}`, inline: true }
                )
                .setFooter({ text: 'Use /cafe to check your café status' });

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
