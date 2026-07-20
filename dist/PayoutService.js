"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayoutService = void 0;
const database_1 = require("./database");
class PayoutService {
    /**
     * Generate a payout batch for a period
     */
    async generatePayoutBatch(startDate, endDate) {
        try {
            console.log(`💰 Generating payout batch for period ${startDate} to ${endDate}`);
            // Get platform config for minimum payout amount
            const { OrderEconomicsService } = await Promise.resolve().then(() => __importStar(require('./OrderEconomicsService')));
            const orderEconomicsService = new OrderEconomicsService();
            const config = await orderEconomicsService.getPlatformConfig();
            const minPayoutAmount = config.min_payout_amount;
            // Get next batch number
            const { data: lastBatch, error: batchError } = await database_1.supabase
                .from('payout_batches')
                .select('batch_number')
                .order('batch_number', { ascending: false })
                .limit(1)
                .single();
            const nextBatchNumber = (lastBatch?.batch_number || 0) + 1;
            // Import WalletService
            const { WalletService } = await Promise.resolve().then(() => __importStar(require('./WalletService')));
            const walletService = new WalletService();
            // Import CashReconciliationService
            const { CashReconciliationService } = await Promise.resolve().then(() => __importStar(require('./CashReconciliationService')));
            const cashReconciliationService = new CashReconciliationService();
            // Get all drivers and vendors with available balance >= minimum payout
            const { data: wallets, error: walletError } = await database_1.supabase
                .from('wallets')
                .select('user_id, user_type, available_balance')
                .gte('available_balance', minPayoutAmount);
            if (walletError) {
                console.error('❌ Error fetching wallets:', walletError);
                return null;
            }
            if (!wallets || wallets.length === 0) {
                console.log('ℹ️ No wallets eligible for payout');
                return null;
            }
            // Create payout batch
            const { data: batch, error: createError } = await database_1.supabase
                .from('payout_batches')
                .insert({
                batch_number: nextBatchNumber,
                period_start: startDate.toISOString(),
                period_end: endDate.toISOString(),
                total_amount: 0,
                status: 'pending'
            })
                .select()
                .single();
            if (createError) {
                console.error('❌ Error creating payout batch:', createError);
                return null;
            }
            let totalBatchAmount = 0;
            // Generate individual payouts
            for (const wallet of wallets) {
                // Get wallet ID by querying the wallets table
                const { data: walletData, error: walletIdError } = await database_1.supabase
                    .from('wallets')
                    .select('id')
                    .eq('user_id', wallet.user_id)
                    .eq('user_type', wallet.user_type)
                    .single();
                if (walletIdError || !walletData) {
                    console.error(`❌ Error fetching wallet ID for ${wallet.user_type} ${wallet.user_id}`);
                    continue;
                }
                const balance = await walletService.getWalletBalance(walletData.id);
                if (!balance)
                    continue;
                const grossAmount = balance.available;
                // Get debt deductions for drivers
                let debtDeductions = 0;
                if (wallet.user_type === 'driver') {
                    debtDeductions = await cashReconciliationService.getDriverTotalDebt(wallet.user_id);
                }
                const netAmount = grossAmount - debtDeductions;
                // Only create payout if net amount >= minimum
                if (netAmount >= minPayoutAmount) {
                    const { error: payoutError } = await database_1.supabase
                        .from('payouts')
                        .insert({
                        batch_id: batch.id,
                        user_id: wallet.user_id,
                        user_type: wallet.user_type,
                        gross_amount: grossAmount,
                        debt_deductions: debtDeductions,
                        credit_additions: 0,
                        net_amount: netAmount,
                        status: 'pending'
                    });
                    if (!payoutError) {
                        totalBatchAmount += netAmount;
                    }
                }
            }
            // Update batch total
            await database_1.supabase
                .from('payout_batches')
                .update({ total_amount: totalBatchAmount })
                .eq('id', batch.id);
            console.log(`✅ Payout batch ${nextBatchNumber} generated successfully with ${totalBatchAmount} total`);
            return batch;
        }
        catch (error) {
            console.error('❌ Exception in generatePayoutBatch:', error);
            return null;
        }
    }
    /**
     * Get payout batch by ID
     */
    async getPayoutBatch(batchId) {
        try {
            console.log(`💰 Getting payout batch ${batchId}`);
            const { data: batch, error } = await database_1.supabase
                .from('payout_batches')
                .select('*')
                .eq('id', batchId)
                .single();
            if (error) {
                console.error('❌ Error fetching payout batch:', error);
                return null;
            }
            console.log('✅ Payout batch retrieved successfully');
            return batch;
        }
        catch (error) {
            console.error('❌ Exception in getPayoutBatch:', error);
            return null;
        }
    }
    /**
     * Get all payouts for a batch
     */
    async getPayoutsForBatch(batchId) {
        try {
            console.log(`💰 Getting payouts for batch ${batchId}`);
            const { data: payouts, error } = await database_1.supabase
                .from('payouts')
                .select('*')
                .eq('batch_id', batchId)
                .order('net_amount', { ascending: false });
            if (error) {
                console.error('❌ Error fetching payouts:', error);
                return [];
            }
            console.log(`✅ Retrieved ${payouts?.length || 0} payouts`);
            return (payouts || []);
        }
        catch (error) {
            console.error('❌ Exception in getPayoutsForBatch:', error);
            return [];
        }
    }
    /**
     * Approve a payout
     */
    async approvePayout(payoutId, approvedBy) {
        try {
            console.log(`💰 Approving payout ${payoutId}`);
            const { error } = await database_1.supabase
                .from('payouts')
                .update({
                status: 'approved'
            })
                .eq('id', payoutId);
            if (error) {
                console.error('❌ Error approving payout:', error);
                return false;
            }
            console.log('✅ Payout approved successfully');
            return true;
        }
        catch (error) {
            console.error('❌ Exception in approvePayout:', error);
            return false;
        }
    }
    /**
     * Reject a payout
     */
    async rejectPayout(payoutId, reason) {
        try {
            console.log(`💰 Rejecting payout ${payoutId}: ${reason}`);
            const { error } = await database_1.supabase
                .from('payouts')
                .update({
                status: 'rejected',
                notes: reason
            })
                .eq('id', payoutId);
            if (error) {
                console.error('❌ Error rejecting payout:', error);
                return false;
            }
            console.log('✅ Payout rejected successfully');
            return true;
        }
        catch (error) {
            console.error('❌ Exception in rejectPayout:', error);
            return false;
        }
    }
    /**
     * Process payout batch
     */
    async processPayoutBatch(batchId, processedBy) {
        try {
            console.log(`💰 Processing payout batch ${batchId}`);
            // Update batch status
            const { error: batchError } = await database_1.supabase
                .from('payout_batches')
                .update({
                status: 'processing',
                processed_at: new Date().toISOString(),
                processed_by: processedBy
            })
                .eq('id', batchId);
            if (batchError) {
                console.error('❌ Error updating batch status:', batchError);
                return false;
            }
            // Get all approved payouts in the batch
            const { data: payouts, error: payoutsError } = await database_1.supabase
                .from('payouts')
                .select('*')
                .eq('batch_id', batchId)
                .eq('status', 'approved');
            if (payoutsError) {
                console.error('❌ Error fetching payouts:', payoutsError);
                return false;
            }
            // Import WalletService
            const { WalletService } = await Promise.resolve().then(() => __importStar(require('./WalletService')));
            const walletService = new WalletService();
            // Import CashReconciliationService
            const { CashReconciliationService } = await Promise.resolve().then(() => __importStar(require('./CashReconciliationService')));
            const cashReconciliationService = new CashReconciliationService();
            // Process each payout
            for (const payout of payouts) {
                try {
                    // Mark as processing
                    await database_1.supabase
                        .from('payouts')
                        .update({ status: 'processing' })
                        .eq('id', payout.id);
                    // Process the payout (TODO: Integrate with payment gateway for bank transfers)
                    // For now, we'll simulate the transfer
                    const transactionReference = `TXN-${Date.now()}-${payout.user_id.substring(0, 8)}`;
                    // Deduct from wallet
                    await walletService.processPayout(payout.user_id, payout.user_type, payout.net_amount, payout.id, `Payout batch ${batchId.substring(0, 8)}...`);
                    // Settle debts if driver
                    if (payout.user_type === 'driver' && payout.debt_deductions > 0) {
                        const debts = await cashReconciliationService.getDriverDebts(payout.user_id);
                        let remainingDeduction = payout.debt_deductions;
                        for (const debt of debts) {
                            if (remainingDeduction <= 0)
                                break;
                            const debtAmount = parseFloat(String(debt.amount_owed));
                            const deductionAmount = Math.min(debtAmount, remainingDeduction);
                            await cashReconciliationService.settleDebt(debt.id, batchId, deductionAmount);
                            remainingDeduction -= deductionAmount;
                        }
                    }
                    // Mark as completed
                    await database_1.supabase
                        .from('payouts')
                        .update({
                        status: 'completed',
                        processed_at: new Date().toISOString(),
                        transaction_reference: transactionReference
                    })
                        .eq('id', payout.id);
                }
                catch (error) {
                    console.error(`❌ Error processing payout ${payout.id}:`, error);
                    // Mark as failed
                    await database_1.supabase
                        .from('payouts')
                        .update({ status: 'failed' })
                        .eq('id', payout.id);
                }
            }
            // Update batch status to completed
            await database_1.supabase
                .from('payout_batches')
                .update({ status: 'completed' })
                .eq('id', batchId);
            console.log('✅ Payout batch processed successfully');
            return true;
        }
        catch (error) {
            console.error('❌ Exception in processPayoutBatch:', error);
            return false;
        }
    }
    /**
     * Get payout history for a user
     */
    async getUserPayoutHistory(userId, userType, limit = 20) {
        try {
            console.log(`💰 Getting payout history for ${userType} ${userId}`);
            const { data: payouts, error } = await database_1.supabase
                .from('payouts')
                .select('*')
                .eq('user_id', userId)
                .eq('user_type', userType)
                .order('created_at', { ascending: false })
                .limit(limit);
            if (error) {
                console.error('❌ Error fetching payout history:', error);
                return [];
            }
            console.log(`✅ Retrieved ${payouts?.length || 0} payouts`);
            return (payouts || []);
        }
        catch (error) {
            console.error('❌ Exception in getUserPayoutHistory:', error);
            return [];
        }
    }
    /**
     * Get all pending payout batches
     */
    async getPendingBatches() {
        try {
            console.log('💰 Getting pending payout batches');
            const { data: batches, error } = await database_1.supabase
                .from('payout_batches')
                .select('*')
                .in('status', ['pending', 'processing'])
                .order('created_at', { ascending: false });
            if (error) {
                console.error('❌ Error fetching pending batches:', error);
                return [];
            }
            console.log(`✅ Retrieved ${batches?.length || 0} pending batches`);
            return (batches || []);
        }
        catch (error) {
            console.error('❌ Exception in getPendingBatches:', error);
            return [];
        }
    }
    /**
     * Cancel a payout batch
     */
    async cancelPayoutBatch(batchId) {
        try {
            console.log(`💰 Cancelling payout batch ${batchId}`);
            const { error } = await database_1.supabase
                .from('payout_batches')
                .update({ status: 'cancelled' })
                .eq('id', batchId);
            if (error) {
                console.error('❌ Error cancelling payout batch:', error);
                return false;
            }
            // Cancel all pending payouts in the batch
            await database_1.supabase
                .from('payouts')
                .update({ status: 'rejected', notes: 'Batch cancelled' })
                .eq('batch_id', batchId)
                .eq('status', 'pending');
            console.log('✅ Payout batch cancelled successfully');
            return true;
        }
        catch (error) {
            console.error('❌ Exception in cancelPayoutBatch:', error);
            return false;
        }
    }
}
exports.PayoutService = PayoutService;
//# sourceMappingURL=PayoutService.js.map