const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('👤 View your café profile')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to view profile of')
                .setRequired(false)
        ),

    async execute(interaction) {
        try {
            const targetUser = interaction.options.getUser('user') || interaction.user;
            const user = await getUser(targetUser.id);

            const embed = new EmbedBuilder()
                .setColor(0xc5774a)
                .setTitle(`☕ ${targetUser.username}'s Café Profile`)
                .setThumbnail(targetUser.displayAvatarURL())
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
