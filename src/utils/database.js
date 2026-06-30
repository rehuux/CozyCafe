const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    {
        realtime: {
            params: {
                eventsPerSecond: 10
            }
        }
    }
);

// ============== USERS ==============

async function getUser(userId) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error && error.code === 'PGRST116') {
        return createUser(userId);
    }
    if (error) throw error;
    return data;
}

async function createUser(userId) {
    const newUser = {
        user_id: userId,
        coins: 50,
        level: 1,
        xp: 0,
        last_daily: null,
        last_collect: new Date().toISOString(),
        total_earned: 0,
        inventory: [],
        equipped_item: null,
        total_hours: 0,
        total_coins_earned: 0,
        total_gambles: 0,
        total_wins: 0,
        streak: 0
    };

    const { data, error } = await supabase
        .from('users')
        .insert([newUser])
        .select()
        .single();

    if (error) throw error;
    return data;
}

async function updateUser(userId, updates) {
    const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

async function getAllUsers() {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('coins', { ascending: false });

    if (error) throw error;
    return data;
}

async function logAdminAction(adminId, targetId, action, amount, reason, guildId) {
    const { error } = await supabase
        .from('admin_logs')
        .insert([{
            admin_id: adminId,
            target_id: targetId,
            action: action,
            amount: amount,
            reason: reason || null,
            guild_id: guildId || null,
            timestamp: new Date().toISOString()
        }]);

    if (error) throw error;
}

const SHOP_ITEMS = [
    { id: 'coffee_machine', name: '☕ Coffee Machine', cost: 200, bonus: 5, description: '+5 coins/hour' },
    { id: 'cake_recipe', name: '🍰 Cake Recipe', cost: 100, bonus: 2, description: '+2 coins/hour' },
    { id: 'music_player', name: '🎵 Music Player', cost: 150, bonus: 3, description: '+3 coins/hour' },
    { id: 'espresso_machine', name: '☕ Espresso Machine', cost: 350, bonus: 8, description: '+8 coins/hour' },
    { id: 'golden_cup', name: '🏆 Golden Cup', cost: 500, bonus: 12, description: '+12 coins/hour' },
    { id: 'barista_hat', name: '🧢 Barista Hat', cost: 75, bonus: 1, description: '+1 coin/hour' },
    { id: 'premium_membership', name: '💎 Premium Membership', cost: 1000, bonus: 20, description: '+20 coins/hour' }
];

module.exports = {
    supabase: supabase,
    getUser: getUser,
    createUser: createUser,
    updateUser: updateUser,
    getAllUsers: getAllUsers,
    logAdminAction: logAdminAction,
    SHOP_ITEMS: SHOP_ITEMS
};
