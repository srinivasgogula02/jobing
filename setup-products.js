const fs = require('fs');
const envSource = fs.readFileSync('.env.local', 'utf-8');
const keyMatch = envSource.match(/DODO_PAYMENTS_API_KEY=(.*)/);
if (!keyMatch) { console.error('No API key found in .env.local'); process.exit(1); }
const key = keyMatch[1].trim();

const { DodoPayments } = require('dodopayments');

async function setupProducts() {
    const dodo = new DodoPayments({
        bearerToken: key,
        environment: 'test_mode'
    });

    const plansInfo = [
        { name: 'Pro', priceInCents: 1500 },
        { name: 'Elite', priceInCents: 4900 },
        { name: 'Enterprise', priceInCents: 19900 }
    ];

    const { items: products } = await dodo.products.list();
    const envVars = {};

    for (const plan of plansInfo) {
        let p = products.find(prod => prod.name === plan.name && prod.is_recurring);
        if (!p) {
            console.log('Creating product:', plan.name);
            p = await dodo.products.create({
                name: plan.name,
                tax_category: 'digital_products',
                price: {
                    type: 'recurring_price',
                    currency: 'USD',
                    price: plan.priceInCents,
                    payment_frequency_count: 1,
                    payment_frequency_interval: 'Month',
                    subscription_period_count: 1,
                    subscription_period_interval: 'Month',
                    discount: 0,
                    purchasing_power_parity: false
                }
            });
        } else {
            console.log('Found existing product:', plan.name);
        }
        envVars['NEXT_PUBLIC_DODO_PRODUCT_ID_' + plan.name.toUpperCase()] = p.product_id;
    }

    let newEnvSource = envSource;
    for (const [k, v] of Object.entries(envVars)) {
        if (!newEnvSource.includes(k)) {
            newEnvSource += '\n' + k + '=' + v + '\n';
            console.log('Added to .env.local:', k, v);
        }
    }

    fs.writeFileSync('.env.local', newEnvSource.trim() + '\n');
    console.log('Products setup complete.');
}

setupProducts().catch(console.error);
