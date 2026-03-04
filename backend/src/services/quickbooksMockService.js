/**
 * Mock QuickBooks Service
 * Simulates interactions with the Intuit QuickBooks Online API.
 */

// Simulated Chart of Accounts
const MOCK_ACCOUNTS = [
    { id: '100', name: 'Room Revenue', type: 'Income' },
    { id: '101', name: 'F&B Revenue', type: 'Income' },
    { id: '102', name: 'Other Income', type: 'Income' },
    { id: '200', name: 'Sales Tax Payable', type: 'Other Current Liability' },
    { id: '300', name: 'Main Checking Account', type: 'Bank' },
    { id: '301', name: 'Stripe Clearing', type: 'Bank' },
    { id: '400', name: 'Merchant Fees', type: 'Expense' }
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const connect = async () => {
    // Simulate OAuth redirect and token fetching
    await sleep(1500);
    return {
        access_token: 'mock_qb_access_token_' + Date.now(),
        refresh_token: 'mock_qb_refresh_token_' + Date.now(),
        realm_id: '1234567890_mock_realm'
    };
};

const getChartOfAccounts = async () => {
    // Simulate fetching accounts
    await sleep(800);
    return MOCK_ACCOUNTS;
};

const syncPayment = async (payment, mappings) => {
    // Simulate API call to create a SalesReceipt or JournalEntry in QuickBooks
    await sleep(1200);

    // Randomly fail 5% of the time to demonstrate error handling
    if (Math.random() < 0.05) {
        throw new Error('QuickBooks API Error: Duplicate transaction or invalid account mapping.');
    }

    return {
        success: true,
        qb_transaction_id: 'qb_txn_' + Math.random().toString(36).substr(2, 9),
        synced_at: new Date().toISOString()
    };
};

module.exports = {
    connect,
    getChartOfAccounts,
    syncPayment
};
