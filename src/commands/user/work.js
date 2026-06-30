const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, updateUser } = require('../../utils/database');
const { randomInt } = require('../../utils/helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('work')
        .setDescription('💼 Work at your café to earn coins!'),

    async execute(interaction) {
        try {
            const user = await getUser(interaction.user.id);
            
            const lastWork = user.last_work ? new Date(user.last_work) : new Date(0);
            const now = new Date();
            const diff = (now - lastWork) / (1000 * 60);
            
            if (diff < 5) {
                const remaining = Math.ceil(5 - diff);
                return interaction.reply({
                    content: `⏳ Wait **${remaining} minutes** before working again.`,
                    ephemeral: true
                });
            }

            const earned = randomInt(5, 20);
            const newCoins = user.coins + earned;

            await updateUser(interaction.user.id, {
                coins: newCoins,
                last_work: now.toISOString(),
                total_earned: (user.total_earned || 0) + earned
            });

            const embed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('💼 Work Complete!')
                .setDescription(`You earned **${earned}** coins!`)
                .addFields(
                    { name: 'New Balance', value: `${newCoins} coins`, inline: true }
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
