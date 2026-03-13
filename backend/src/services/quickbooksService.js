const OAuthClient = require('intuit-oauth');

// Helper to initialize the client
const getClient = (tokenData = null) => {
    const client = new OAuthClient({
        clientId: process.env.QUICKBOOKS_CLIENT_ID,
        clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET,
        environment: process.env.QUICKBOOKS_ENVIRONMENT || 'sandbox',
        redirectUri: process.env.QUICKBOOKS_REDIRECT_URI,
    });

    if (tokenData) {
        client.setToken(tokenData);
    }

    return client;
};

const getAuthUri = () => {
    const client = getClient();
    const authUri = client.authorizeUri({
        scope: [OAuthClient.scopes.Accounting],
        state: 'cardea-oauth',
    });
    return authUri;
};

const createToken = async (url) => {
    const client = getClient();
    const authResponse = await client.createToken(url);
    return {
        token: authResponse.getJson(),
        realmId: client.getToken().realmId
    };
};

const getCompanyInfo = async (tokenData, realmId) => {
    const client = getClient(tokenData);
    try {
        const companyID = client.getToken().realmId || realmId;
        const response = await client.makeApiCall({
            url: `${client.environment === 'sandbox' ? 'https://sandbox-quickbooks.api.intuit.com' : 'https://quickbooks.api.intuit.com'}/v3/company/${companyID}/companyinfo/${companyID}`
        });
        return response.getJson();
    } catch (err) {
        console.error("Error fetching QBO Company Info:", err.authResponse ? err.authResponse : err);
        throw err;
    }
};

const getAccounts = async (tokenData, realmId) => {
    const client = getClient(tokenData);
    try {
        const companyID = client.getToken().realmId || realmId;
        // Querying Income and Bank accounts
        const query = `select * from Account where AccountType in ('Income', 'Bank', 'Other Current Liability', 'Other Current Asset')`;
        const response = await client.makeApiCall({
            url: `${client.environment === 'sandbox' ? 'https://sandbox-quickbooks.api.intuit.com' : 'https://quickbooks.api.intuit.com'}/v3/company/${companyID}/query?query=${encodeURIComponent(query)}`
        });
        return response.getJson().QueryResponse.Account || [];
    } catch (err) {
        console.error("Error fetching QBO Accounts:", err.authResponse ? err.authResponse : err);
        throw err;
    }
};

const syncPayment = async (tokenData, realmId, paymentDetails, mappings) => {
    const client = getClient(tokenData);
    const companyID = client.getToken().realmId || realmId;
    const baseUrl = client.environment === 'sandbox' ? 'https://sandbox-quickbooks.api.intuit.com' : 'https://quickbooks.api.intuit.com';

    try {
        // We create a generic SalesReceipt to record the payment
        const salesReceipt = {
            Line: [
                {
                    Amount: paymentDetails.amount,
                    DetailType: "SalesItemLineDetail",
                    SalesItemLineDetail: {
                        ItemRef: {
                            value: "1", // In a real robust integration, items would be mapped too. We'll use a generic sales item or just post directly.
                            name: "Services"
                        }
                    }
                }
            ],
            DepositToAccountRef: {
                value: mappings.deposit_account_id
            },
            CustomerRef: {
                value: "1" // This requires a Customer in QBO. We will simplify by just creating a Journal Entry instead to avoid managing Customers/Items.
            }
        };

        // Since mapping items and customers adds complexity, a Journal Entry is the safest way to just sync financial values in a minimal integration:
        const journalEntry = {
            JournalEntryLineDetail: [
                {
                    Id: "0",
                    Description: `Cardea Payment - Res ${paymentDetails.reservation_id}`,
                    Amount: paymentDetails.amount,
                    DetailType: "JournalEntryLineDetail",
                    JournalEntryLineDetail: {
                        PostingType: "Debit",
                        AccountRef: {
                            value: mappings.deposit_account_id // e.g. Undeposited Funds
                        }
                    }
                },
                {
                    Id: "1",
                    Description: `Cardea Revenue - Res ${paymentDetails.reservation_id}`,
                    Amount: paymentDetails.amount,
                    DetailType: "JournalEntryLineDetail",
                    JournalEntryLineDetail: {
                        PostingType: "Credit",
                        AccountRef: {
                            value: mappings.income_account_id // e.g. Room Revenue
                        }
                    }
                }
            ]
        };

        const response = await client.makeApiCall({
            url: `${baseUrl}/v3/company/${companyID}/journalentry`,
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(journalEntry)
        });

        const jsonRsp = response.getJson();
        return jsonRsp.JournalEntry.Id;

    } catch (err) {
        console.error("Error syncing payment to QBO:", err.authResponse ? err.authResponse.json : err);
        throw new Error(err.authResponse ? err.authResponse.text() : err.message);
    }
};

module.exports = {
    getAuthUri,
    createToken,
    getCompanyInfo,
    getAccounts,
    syncPayment,
};
