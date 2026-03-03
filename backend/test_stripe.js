require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function runTest() {
    console.log("Testing Stripe Implementation...");
    if (!process.env.STRIPE_SECRET_KEY) {
        console.error("❌ Fatal Error: STRIPE_SECRET_KEY is missing in backend/.env");
        process.exit(1);
    }

    if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
        console.warn("⚠️ Warning: STRIPE_SECRET_KEY does not start with sk_test_. Be careful with live keys!");
    }

    try {
        console.log("Attempting to create a PaymentIntent for $50.00...");
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 5000,
            currency: 'usd',
            automatic_payment_methods: { enabled: true },
            metadata: { integration_check: 'true' }
        });

        console.log("✅ Success! Created PaymentIntent with ID:", paymentIntent.id);
        console.log("Client Secret starts with:", paymentIntent.client_secret.substring(0, 30) + "...");
    } catch (err) {
        console.error("❌ Failed to create PaymentIntent:", err.message);
    }
}

runTest();
