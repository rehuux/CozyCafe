const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { updateUser, logAdminAction } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reset')
        .setDescription('🔄 Reset a user\'s data (Admin only)')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to reset')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: '❌ Admin only.',
                ephemeral: true
            });
        }

        const targetUser = interaction.options.getUser('user');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('confirm_reset')
                    .setLabel('⚠️ Confirm Reset')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('cancel_reset')
                    .setLabel('❌ Cancel')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({
            content: `⚠️ Reset **${targetUser.username}**? This CANNOT be undone!`,
            components: [row],
            ephemeral: true
        });

        const filter = i => i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 30000,
            max: 1
        });

        collector.on('collect', async i => {
            if (i.customId === 'cancel_reset') {
                await i.update({
                    content: '❌ Cancelled.',
                    components: [],
                    ephemeral: true
                });
                return;
            }

            if (i.customId === 'confirm_reset') {
                try {
                    await updateUser(targetUser.id, {
                        coins: 50,
                        level: 1,
                        xp: 0,
                        last_daily: null,
                        last_collect: new Date().toISOString(),
                        total_earned: 0,
                        inventory: [],
                        equipped_item: null,
                        streak: 0
                    });

                    await logAdminAction(interaction.user.id, targetUser.id, 'reset', 0, 'User data reset', interaction.guildId);

                    try {
                        await targetUser.send(`🔄 Your café data was reset by **${interaction.user.username}**. You start fresh with 50 coins.`);
                    } catch (dmError) {}

                    await i.update({
                        content: `✅ ${targetUser.username}'s data reset!`,
                        components: [],
                        ephemeral: true
                    });

                } catch (error) {
                    console.error(error);
                    await i.update({
                        content: '❌ Something went wrong.',
                        components: [],
                        ephemeral: true
                    });
                }
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.editReply({
                    content: '⏰ Timed out.',
                    components: [],
                    ephemeral: true
                });
            }
        });
    }
};
