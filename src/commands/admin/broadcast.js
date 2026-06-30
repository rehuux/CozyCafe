const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logAdminAction } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('broadcast')
        .setDescription('📢 Send a broadcast message (Admin only)')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Message to broadcast')
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

        const message = interaction.options.getString('message');

        const embed = new EmbedBuilder()
            .setColor(0x00aaff)
            .setTitle('📢 Broadcast')
            .setDescription(message)
            .addFields(
                { name: 'From', value: `${interaction.user.username}`, inline: true },
                { name: 'Server', value: interaction.guild.name, inline: true }
            )
            .setTimestamp();

        await interaction.channel.send({ embeds: [embed] });

        await logAdminAction(interaction.user.id, null, 'broadcast', 0, `Broadcast: ${message.substring(0, 50)}...`, interaction.guildId);

        await interaction.reply({
            content: '✅ Broadcast sent!',
            ephemeral: true
        });
    }
};
