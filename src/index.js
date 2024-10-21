const express = require("express");
require('dotenv').config()
const cors = require('cors');
const stripe = require("stripe")(process.env.STRIPE_KEY)

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Разрешает доступ с любых доменов
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
});

const plans = {
    basic: process.env.BASIC,
    standard: process.env.STANDARD,
    premium: process.env.PREMIUM
}

app.get('/create-subscription', async (req, res) => {
    try {
        const { email, paymentMethodId, plan } = req.query; 

        const customer = await stripe.customers.create({
            email: email,
            payment_method: paymentMethodId,
            invoice_settings: {
                default_payment_method: paymentMethodId,
            },
        });

        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: plans[plan] }],
            expand: ['latest_invoice.payment_intent'],
        });

        res.json({
            subscriptionId: subscription.id,
            clientSecret: subscription.latest_invoice.payment_intent.client_secret,
        });
    } catch (error) {
        console.log(error)
        res.status(500).send({ error: "Failed to create checkout session" });
    }
});

app.listen(port, () => {
    console.log(`Server is up on port ${port}.`)
});
