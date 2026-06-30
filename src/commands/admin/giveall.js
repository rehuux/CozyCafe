const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUser, updateUser, logAdminAction } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveall')
        .setDescription('💰 Give coins to ALL users (Admin only)')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of coins to give to EVERYONE')
                .setRequired(true)
                .setMinValue(1)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason (optional)')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: '❌ Admin only.',
                ephemeral: true
            });
        }

        const amount = interaction.options.getInteger('amount');
        const reason = interaction.options.getString('reason') || 'Server giveaway! 🎉';

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('confirm_giveall')
                    .setLabel('✅ Confirm')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('cancel_giveall')
                    .setLabel('❌ Cancel')
                    .setStyle(ButtonStyle.Danger)
            );

        const confirmEmbed = new EmbedBuilder()
            .setColor(0xffa500)
            .setTitle('⚠️ Confirm Giveaway')
            .setDescription(`Give **${amount} coins** to **ALL** users?`)
            .addFields(
                { name: 'Users', value: `${interaction.guild.memberCount} approx`, inline: true },
                { name: 'Reason', value: reason, inline: false }
            );

        await interaction.reply({
            embeds: [confirmEmbed],
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
            if (i.customId === 'cancel_giveall') {
                await i.update({
                    content: '❌ Cancelled.',
                    embeds: [],
                    components: [],
                    ephemeral: true
                });
                return;
            }

            if (i.customId === 'confirm_giveall') {
                await i.update({
                    content: '⏳ Processing...',
                    embeds: [],
                    components: [],
                    ephemeral: true
                });

                try {
                    const members = await interaction.guild.members.fetch();
                    const humanMembers = members.filter(m => !m.user.bot);
                    
                    let successCount = 0;
                    const userArray = [...humanMembers.values()];

                    for (const member of userArray) {
                        try {
                            const user = await getUser(member.id);
                            const newCoins = (user.coins || 0) + amount;
                            
                            await updateUser(member.id, {
                                coins: newCoins,
                                total_earned: (user.total_earned || 0) + amount
                            });

                            await logAdminAction(
                                interaction.user.id,
                                member.id,
                                'giveall',
                                amount,
                                reason,
                                interaction.guildId
                            );

                            try {
                                await member.send(`🎉 You received **${amount}** coins! Reason: ${reason}`);
                            } catch (dmError) {}

                            successCount++;
                        } catch (error) {
                            console.error(`Failed for ${member.user.username}:`, error);
                        }
                    }

                    const broadcastEmbed = new EmbedBuilder()
                        .setColor(0x00ff00)
                        .setTitle('🎉 Giveaway Complete!')
                        .setDescription(`**${amount} coins** given to **${successCount}** users!`)
                        .addFields(
                            { name: 'Reason', value: reason, inline: false }
                        )
                        .setFooter({ text: `Admin: ${interaction.user.username}` })
                        .setTimestamp();

                    await interaction.channel.send({ embeds: [broadcastEmbed] });

                    await interaction.editReply({
                        content: `✅ Done! ${successCount} users received ${amount} coins.`,
                        ephemeral: true
                    });

                } catch (error) {
                    console.error(error);
                    await interaction.editReply({
                        content: '❌ Something went wrong.',
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
