import { Client, Databases } from 'node-appwrite';

const client = new Client()
    .setEndpoint('https://sgp.cloud.appwrite.io/v1')
    .setProject('69a2731e00047b3b01e9')
    .setKey('standard_a22e237c81225a0ddf2b85af6186581642914ff61070b3abf48ed21e79b199566c23d0c7da97d0aae776233d75eefc299b979cac699793e846f5c0d945b1edb3040efc0e5c9093d3235de74df9a6932278ea2cc62548231e8a383229956dbe74d1e529d9a9468ac3d95f29f267a4ecf9be283517243686e63162d1b84bd342cf');

const db = new Databases(client);
const DB = 'staysetu_db';
const wait = (ms) => new Promise(r => setTimeout(r, ms));

async function run() {
    const attributes = [
        { key: 'association', size: 100, default: '' },
        { key: 'nearbyCollege', size: 100, default: '' },
        { key: 'listedBy', size: 50, default: 'owner' },
        { key: 'genderPreference', size: 50, default: 'any' },
        { key: 'occupancy', size: 500, default: '["single"]' },
        { key: 'deposit', size: 50, default: '' },
        { key: 'availableFrom', size: 50, default: '' },
    ];

    for (const attr of attributes) {
        try {
            await db.createStringAttribute(DB, 'listings', attr.key, attr.size, false, attr.default);
            console.log(`✅ Added ${attr.key}`);
        } catch (e) {
            console.log(`⚠️  ${attr.key}: ${e.message}`);
        }
        await wait(1000); // Give appwrite a moment to process each
    }
}

run();
