const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, updateUser } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gamble')
        .setDescription('🎰 Gamble your coins (50% chance to double!)')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount to gamble')
                .setRequired(true)
                .setMinValue(1)
        ),

    async execute(interaction) {
        try {
            const amount = interaction.options.getInteger('amount');
            const user = await getUser(interaction.user.id);

            if (user.coins < amount) {
                return interaction.reply({
                    content: `❌ You only have ${user.coins} coins.`,
                    ephemeral: true
                });
            }

            const win = Math.random() < 0.5;
            const newCoins = win ? user.coins + amount : user.coins - amount;

            await updateUser(interaction.user.id, {
                coins: newCoins,
                total_gambles: (user.total_gambles || 0) + 1,
                total_wins: (user.total_wins || 0) + (win ? 1 : 0)
            });

            const embed = new EmbedBuilder()
                .setColor(win ? 0x00ff00 : 0xff0000)
                .setTitle(win ? '🎉 You Won!' : '😢 You Lost!')
                .setDescription(win 
                    ? `You doubled your bet! +${amount} coins!` 
                    : `You lost ${amount} coins.`
                )
                .addFields(
                    { name: '💰 New Balance', value: `${newCoins} coins`, inline: true }
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
