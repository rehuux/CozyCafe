const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getAllUsers } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('🏆 View the richest café owners'),

    async execute(interaction) {
        try {
            const users = await getAllUsers();
            const sorted = users.sort((a, b) => b.coins - a.coins);
            const top = sorted.slice(0, 10);

            let description = '';
            const medals = ['🥇', '🥈', '🥉'];

            top.forEach((user, index) => {
                const medal = index < 3 ? medals[index] : `${index + 1}.`;
                const username = user.username || user.user_id;
                description += `${medal} **${username}** — ${user.coins} coins\n`;
            });

            const embed = new EmbedBuilder()
                .setColor(0xffd700)
                .setTitle('🏆 Richest Café Owners')
                .setDescription(description || 'No users found.')
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
