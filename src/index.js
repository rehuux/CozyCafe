const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const http = require('http');
require('dotenv').config();

// ============== HTTP SERVER FOR RENDER ==============
const server = http.createServer((req, res) => {
    if (req.url === '/health' || req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'online', 
            bot: 'Cozy Café',
            uptime: process.uptime()
        }));
    } else {
        res.writeHead(404);
        res.end();
    }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', function() {
    console.log('✅ HTTP server running on port ' + PORT);
});

// Handle server errors
server.on('error', function(error) {
    console.error('HTTP Server error:', error);
});

// ============== DISCORD BOT ==============
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages
    ]
});

client.commands = new Collection();

// ============== LOAD COMMANDS ==============
function loadCommands(dir) {
    var files;
    try {
        files = fs.readdirSync(dir);
    } catch (error) {
        console.error('Error reading commands directory:', error);
        return;
    }
    
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var filePath = path.join(dir, file);
        var stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            loadCommands(filePath);
        } else if (file.endsWith('.js')) {
            try {
                var command = require(filePath);
                if ('data' in command && 'execute' in command) {
                    client.commands.set(command.data.name, command);
                    console.log('✅ Loaded: ' + command.data.name);
                }
            } catch (error) {
                console.error('Error loading command ' + file + ':', error);
            }
        }
    }
}

loadCommands(path.join(__dirname, 'commands'));

// ============== BOT EVENTS ==============
client.once('ready', function() {
    console.log('✅ ' + client.user.tag + ' is online!');
    console.log('📊 Serving ' + client.guilds.cache.size + ' servers');
    console.log('📋 Commands loaded: ' + client.commands.size);
});

client.on('interactionCreate', async function(interaction) {
    if (!interaction.isChatInputCommand()) return;

    var command = client.commands.get(interaction.commandName);
    if (!command) {
        console.warn('Command not found: ' + interaction.commandName);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error('Error executing command ' + interaction.commandName + ':', error);
        await interaction.reply({
            content: '❌ Something went wrong! Please try again.',
            ephemeral: true
        }).catch(function(err) {
            console.error('Failed to reply:', err);
        });
    }
});

// ============== GRACEFUL SHUTDOWN ==============
process.on('SIGINT', function() {
    console.log('🛑 Shutting down...');
    client.destroy();
    server.close(function() {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGTERM', function() {
    console.log('🛑 Received SIGTERM, shutting down...');
    client.destroy();
    server.close(function() {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

// ============== START BOT ==============
var token = process.env.DISCORD_TOKEN;
if (!token) {
    console.error('❌ DISCORD_TOKEN not set in environment variables!');
    process.exit(1);
}

client.login(token).catch(function(error) {
    console.error('❌ Failed to login:', error);
    process.exit(1);
});
