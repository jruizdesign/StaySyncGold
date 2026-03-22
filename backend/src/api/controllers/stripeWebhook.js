const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_fallback';
const stripe = require('stripe')(stripeSecretKey);
const db = require('../../config/database');

const handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        // req.body is a Buffer here because we used express.raw() in index.js
        if (endpointSecret) {
            event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        } else {
            // For local development without webhook secret configured
            event = JSON.parse(req.body.toString());
        }
    } catch (err) {
        console.error('Webhook Error:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const paymentIntentId = paymentIntent.id;

        console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);

        // Update our database
        try {
            await db.query(
                'UPDATE public.payments SET status = $1 WHERE stripe_payment_intent_id = $2',
                ['succeeded', paymentIntentId]
            );
        } catch (dbErr) {
            console.error('Error updating payment status in DB', dbErr);
        }
    } else if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object;
        const paymentIntentId = paymentIntent.id;

        console.log(`PaymentIntent failed!`);

        try {
            await db.query(
                'UPDATE public.payments SET status = $1 WHERE stripe_payment_intent_id = $2',
                ['failed', paymentIntentId]
            );
        } catch (dbErr) {
            console.error('Error updating payment status in DB', dbErr);
        }
    }

    // Return a 200 response to acknowledge receipt of the event
    res.send();
};

module.exports = {
    handleStripeWebhook
};
