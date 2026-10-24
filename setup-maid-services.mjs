/**
 * StaySetu — Maid Services Collection Setup
 * Creates the `maid_services` collection in Appwrite.
 * Run: node setup-maid-services.mjs
 */
import { Client, Databases, Permission, Role } from 'node-appwrite';

const APPWRITE_ENDPOINT = 'https://sgp.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '69a2731e00047b3b01e9';
const APPWRITE_API_KEY = 'standard_a22e237c81225a0ddf2b85af6186581642914ff61070b3abf48ed21e79b199566c23d0c7da97d0aae776233d75eefc299b979cac699793e846f5c0d945b1edb3040efc0e5c9093d3235de74df9a6932278ea2cc62548231e8a383229956dbe74d1e529d9a9468ac3d95f29f267a4ecf9be283517243686e63162d1b84bd342cf';

const DATABASE_ID = 'staysetu_db';
const COLLECTION_ID = 'maid_services';

const client = new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID).setKey(APPWRITE_API_KEY);
const db = new Databases(client);
const wait = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
    console.log('🧹 Creating maid_services collection...');
    try {
        await db.createCollection(DATABASE_ID, COLLECTION_ID, 'Maid Services', [
            Permission.read(Role.any()),
            Permission.create(Role.users()),
            Permission.update(Role.users()),
            Permission.delete(Role.users()),
        ]);
        console.log('   ✅ Collection created');
    } catch (e) {
        if (e.code === 409) console.log('   ⚠️  Already exists');
        else { console.error('❌', e.message); return; }
    }

    const strings = [
        ['title', 255, true],
        ['description', 2000, false],
        ['location', 500, true],
        ['serviceType', 50, false],     // cooking, cleaning, laundry, all-in-one, etc.
        ['timing', 100, false],          // e.g. "Morning 8-11 AM"
        ['whatsappNumber', 20, true],
        ['phoneNumber', 20, false],
        ['postedBy', 36, true],          // userId of poster (owner/admin)
        ['posterName', 255, false],
        ['status', 20, true],           // pending, approved
        ['genderPreference', 10, false],
    ];

    console.log('📝 Adding attributes...');
    for (const [key, size, req] of strings) {
        try {
            const def = key === 'status' ? 'pending' : (key === 'genderPreference' ? 'any' : (key === 'serviceType' ? 'all-in-one' : null));
            await db.createStringAttribute(DATABASE_ID, COLLECTION_ID, key, size, req, def);
            console.log(`   + ${key} (string, ${size})`);
        } catch (e) { if (e.code === 409) console.log(`   ⚠️  ${key} exists`); else console.log(`   ❌ ${key}: ${e.message}`); }
        await wait(1500);
    }

    // Price as float
    try {
        await db.createFloatAttribute(DATABASE_ID, COLLECTION_ID, 'price', false);
        console.log('   + price (float)');
    } catch (e) { if (e.code === 409) console.log('   ⚠️  price exists'); else console.log(`   ❌ price: ${e.message}`); }
    await wait(1500);

    // Datetime
    try {
        await db.createDatetimeAttribute(DATABASE_ID, COLLECTION_ID, 'createdAt', false);
        console.log('   + createdAt (datetime)');
    } catch (e) { if (e.code === 409) console.log('   ⚠️  createdAt exists'); else console.log(`   ❌ createdAt: ${e.message}`); }
    await wait(1500);

    console.log('🔑 Adding indexes...');
    await wait(3000);
    const indexes = [
        ['status', 'key', ['status']],
        ['postedBy', 'key', ['postedBy']],
        ['location', 'key', ['location']],
        ['createdAt', 'key', ['createdAt']],
    ];
    for (const [key, type, attrs] of indexes) {
        try {
            await db.createIndex(DATABASE_ID, COLLECTION_ID, `idx_${key}`, type, attrs);
            console.log(`   🔑 Index on [${attrs.join(', ')}]`);
        } catch (e) { if (e.code === 409) console.log(`   ⚠️  idx_${key} exists`); else console.log(`   ❌ idx_${key}: ${e.message}`); }
        await wait(1500);
    }

    console.log('\n✅ maid_services collection ready!');
}

main().catch(console.error);
