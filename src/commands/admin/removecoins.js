const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getUser, updateUser, logAdminAction } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removecoins')
        .setDescription('💰 Remove coins from a user (Admin only)')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to remove coins from')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of coins to remove')
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

        const targetUser = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');
        const reason = interaction.options.getString('reason') || 'Admin action';

        try {
            const user = await getUser(targetUser.id);

            if (user.coins < amount) {
                return interaction.reply({
                    content: `❌ ${targetUser.username} only has ${user.coins} coins.`,
                    ephemeral: true
                });
            }

            const newCoins = user.coins - amount;

            await updateUser(targetUser.id, { coins: newCoins });
            await logAdminAction(interaction.user.id, targetUser.id, 'removecoins', amount, reason, interaction.guildId);

            try {
                await targetUser.send(`💰 **${amount}** coins removed from your account. Reason: ${reason}`);
            } catch (dmError) {}

            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('💰 Coins Removed')
                .setDescription(`✅ Removed **${amount}** coins from ${targetUser}`)
                .addFields(
                    { name: 'New Balance', value: `${newCoins} coins`, inline: true },
                    { name: 'Reason', value: reason, inline: false }
                )
                .setFooter({ text: `Admin: ${interaction.user.username}` })
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
