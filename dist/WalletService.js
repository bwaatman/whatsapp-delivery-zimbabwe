"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const database_1 = require("./database");
class WalletService {
    /**
     * Get or create a wallet for a user
     */
    async getOrCreateWallet(userId, userType) {
        try {
            console.log(`💰 Getting or creating wallet for user ${userId} (${userType})`);
            // Try to get existing wallet
            const { data: existingWallet, error: fetchError } = await database_1.supabase
                .from('wallets')
                .select('*')
                .eq('user_id', userId)
                .eq('user_type', userType)
                .single();
            if (existingWallet) {
                console.log('✅ Wallet found');
                return existingWallet;
            }
            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error('❌ Error fetching wallet:', fetchError);
                return null;
            }
            // Create new wallet
            const { data: newWallet, error: createError } = await database_1.supabase
                .from('wallets')
                .insert({
                user_id: userId,
                user_type: userType,
                available_balance: 0,
                pending_balance: 0,
                withheld_balance: 0
            })
                .select()
                .single();
            if (createError) {
                console.error('❌ Error creating wallet:', createError);
                return null;
            }
            console.log('✅ Wallet created successfully');
            return newWallet;
        }
        catch (error) {
            console.error('❌ Exception in getOrCreateWallet:', error);
            return null;
        }
    }
    /**
     * Get wallet balance (recalculated from ledger)
     */
    async getWalletBalance(walletId) {
        try {
            console.log(`💰 Calculating balance for wallet ${walletId}`);
            // Get all completed transactions for this wallet
            const { data: transactions, error } = await database_1.supabase
                .from('transaction_ledger')
                .select('*')
                .eq('wallet_id', walletId)
                .eq('status', 'completed')
                .order('created_at', { ascending: true });
            if (error) {
                console.error('❌ Error fetching transactions:', error);
                return null;
            }
            // Calculate balances based on transaction types
            let available = 0;
            let pending = 0;
            let withheld = 0;
            if (transactions) {
                transactions.forEach(tx => {
                    const amount = parseFloat(String(tx.amount));
                    switch (tx.transaction_type) {
                        case 'earning':
                        case 'credit':
                        case 'release':
                            available += amount;
                            break;
                        case 'deduction':
                        case 'payout':
                        case 'debt':
                            available -= amount;
                            break;
                        case 'withhold':
                            available -= amount;
                            withheld += amount;
                            break;
                        case 'deposit':
                            available += amount;
                            break;
                        case 'refund':
                            // Refunds affect available balance
                            available -= amount;
                            break;
                    }
                });
            }
            const total = available + pending + withheld;
            // Update wallet with calculated balances
            await database_1.supabase
                .from('wallets')
                .update({
                available_balance: available,
                pending_balance: pending,
                withheld_balance: withheld,
                updated_at: new Date().toISOString()
            })
                .eq('id', walletId);
            console.log(`✅ Balance calculated: Available=${available}, Pending=${pending}, Withheld=${withheld}, Total=${total}`);
            return { available, pending, withheld, total };
        }
        catch (error) {
            console.error('❌ Exception in getWalletBalance:', error);
            return null;
        }
    }
    /**
     * Record a transaction in the ledger
     */
    async recordTransaction(transaction) {
        try {
            console.log(`💰 Recording transaction: ${transaction.transaction_type} of ${transaction.amount}`);
            // Get current balance
            const currentBalance = await this.getWalletBalance(transaction.wallet_id);
            if (!currentBalance) {
                console.error('❌ Failed to get current balance');
                return null;
            }
            // Calculate balance after transaction
            let balanceAfter = currentBalance.available;
            const amount = parseFloat(String(transaction.amount));
            switch (transaction.transaction_type) {
                case 'earning':
                case 'credit':
                case 'release':
                case 'deposit':
                    balanceAfter += amount;
                    break;
                case 'deduction':
                case 'payout':
                case 'debt':
                case 'refund':
                    balanceAfter -= amount;
                    break;
                case 'withhold':
                    balanceAfter -= amount;
                    break;
            }
            // Prevent negative balance for certain transaction types
            if (balanceAfter < 0 && ['payout', 'deduction'].includes(transaction.transaction_type)) {
                console.error('❌ Insufficient balance for transaction');
                return null;
            }
            // Record transaction
            const { data: recordedTx, error } = await database_1.supabase
                .from('transaction_ledger')
                .insert({
                ...transaction,
                balance_after: balanceAfter
            })
                .select()
                .single();
            if (error) {
                console.error('❌ Error recording transaction:', error);
                return null;
            }
            // Update wallet balance
            await this.getWalletBalance(transaction.wallet_id);
            console.log('✅ Transaction recorded successfully');
            return recordedTx;
        }
        catch (error) {
            console.error('❌ Exception in recordTransaction:', error);
            return null;
        }
    }
    /**
     * Add earnings to wallet
     */
    async addEarnings(userId, userType, amount, referenceId, description) {
        try {
            console.log(`💰 Adding earnings: ${amount} for ${userType} ${userId}`);
            const wallet = await this.getOrCreateWallet(userId, userType);
            if (!wallet) {
                console.error('❌ Failed to get wallet');
                return false;
            }
            await this.recordTransaction({
                wallet_id: wallet.id,
                transaction_type: 'earning',
                amount: amount,
                balance_after: 0, // Will be calculated
                reference_id: referenceId,
                reference_type: 'order',
                description: description,
                status: 'completed'
            });
            console.log('✅ Earnings added successfully');
            return true;
        }
        catch (error) {
            console.error('❌ Exception in addEarnings:', error);
            return false;
        }
    }
    /**
     * Deduct commission from wallet
     */
    async deductCommission(userId, userType, amount, referenceId, description) {
        try {
            console.log(`💰 Deducting commission: ${amount} from ${userType} ${userId}`);
            const wallet = await this.getOrCreateWallet(userId, userType);
            if (!wallet) {
                console.error('❌ Failed to get wallet');
                return false;
            }
            await this.recordTransaction({
                wallet_id: wallet.id,
                transaction_type: 'deduction',
                amount: amount,
                balance_after: 0, // Will be calculated
                reference_id: referenceId,
                reference_type: 'order',
                description: description,
                status: 'completed'
            });
            console.log('✅ Commission deducted successfully');
            return true;
        }
        catch (error) {
            console.error('❌ Exception in deductCommission:', error);
            return false;
        }
    }
    /**
     * Process payout
     */
    async processPayout(userId, userType, amount, referenceId, description) {
        try {
            console.log(`💰 Processing payout: ${amount} for ${userType} ${userId}`);
            const wallet = await this.getOrCreateWallet(userId, userType);
            if (!wallet) {
                console.error('❌ Failed to get wallet');
                return false;
            }
            const success = await this.recordTransaction({
                wallet_id: wallet.id,
                transaction_type: 'payout',
                amount: amount,
                balance_after: 0, // Will be calculated
                reference_id: referenceId,
                reference_type: 'payout',
                description: description,
                status: 'completed'
            });
            if (!success) {
                console.error('❌ Failed to process payout');
                return false;
            }
            console.log('✅ Payout processed successfully');
            return true;
        }
        catch (error) {
            console.error('❌ Exception in processPayout:', error);
            return false;
        }
    }
    /**
     * Get transaction history for a wallet
     */
    async getTransactionHistory(walletId, limit = 50) {
        try {
            console.log(`💰 Getting transaction history for wallet ${walletId}`);
            const { data: transactions, error } = await database_1.supabase
                .from('transaction_ledger')
                .select('*')
                .eq('wallet_id', walletId)
                .order('created_at', { ascending: false })
                .limit(limit);
            if (error) {
                console.error('❌ Error fetching transaction history:', error);
                return [];
            }
            console.log(`✅ Retrieved ${transactions?.length || 0} transactions`);
            return (transactions || []);
        }
        catch (error) {
            console.error('❌ Exception in getTransactionHistory:', error);
            return [];
        }
    }
}
exports.WalletService = WalletService;
//# sourceMappingURL=WalletService.js.map