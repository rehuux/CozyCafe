const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, updateUser } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('🎁 Claim your daily bonus!'),

    async execute(interaction) {
        try {
            const user = await getUser(interaction.user.id);
            
            const now = new Date();
            const lastDaily = user.last_daily ? new Date(user.last_daily) : new Date(0);
            const diff = (now - lastDaily) / (1000 * 60 * 60 * 24);
            
            if (diff < 24) {
                const remaining = Math.ceil(24 - diff);
                return interaction.reply({
                    content: `⏳ Come back in **${remaining} hours**.`,
                    ephemeral: true
                });
            }

            const bonus = 25 + (user.streak || 0) * 5;
            const newCoins = user.coins + bonus;
            const newStreak = (user.streak || 0) + 1;

            await updateUser(interaction.user.id, {
                coins: newCoins,
                last_daily: now.toISOString(),
                streak: newStreak,
                total_earned: (user.total_earned || 0) + bonus
            });

            const embed = new EmbedBuilder()
                .setColor(0xffa500)
                .setTitle('🎁 Daily Bonus Claimed!')
                .setDescription(`You received **${bonus}** coins!`)
                .addFields(
                    { name: '📈 Streak', value: `${newStreak} days`, inline: true },
                    { name: '💰 New Balance', value: `${newCoins} coins`, inline: true }
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
