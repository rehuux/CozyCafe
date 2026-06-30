const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getUser, updateUser, logAdminAction } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addcoins')
        .setDescription('💰 Add coins to a user (Admin only)')
        .addUserOption(function(option) {
            return option.setName('user')
                .setDescription('User to add coins to')
                .setRequired(true);
        })
        .addIntegerOption(function(option) {
            return option.setName('amount')
                .setDescription('Number of coins to add')
                .setRequired(true)
                .setMinValue(1);
        })
        .addStringOption(function(option) {
            return option.setName('reason')
                .setDescription('Reason (optional)')
                .setRequired(false);
        })
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: '❌ Admin only.',
                ephemeral: true
            });
        }

        const targetUser = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');
        const reason = interaction.options.getString('reason') || 'Admin gift';

        try {
            const user = await getUser(targetUser.id);
            const newCoins = user.coins + amount;

            await updateUser(targetUser.id, {
                coins: newCoins,
                total_earned: (user.total_earned || 0) + amount
            });

            await logAdminAction(interaction.user.id, targetUser.id, 'addcoins', amount, reason, interaction.guildId);

            try {
                await targetUser.send('💰 You received **' + amount + '** coins! Reason: ' + reason);
            } catch (dmError) {
                // User has DMs disabled
            }

            const embed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('💰 Coins Added')
                .setDescription('✅ Added **' + amount + '** coins to ' + targetUser)
                .addFields(
                    { name: 'New Balance', value: newCoins + ' coins', inline: true },
                    { name: 'Reason', value: reason, inline: false }
                )
                .setFooter({ text: 'Admin: ' + interaction.user.username })
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
