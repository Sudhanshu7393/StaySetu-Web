/**
 * ============================================================
 *  StaySetu — WhatsApp Leads Collection Setup
 * ============================================================
 *
 *  Creates the `whatsapp_leads` collection in Appwrite to track
 *  every "Contact via WhatsApp" click.
 *
 *  HOW TO USE:
 *  1. Make sure node-appwrite is installed: npm install node-appwrite
 *  2. Run:  node setup-whatsapp-leads.mjs
 * ============================================================
 */

import { Client, Databases, Permission, Role } from 'node-appwrite';

// ── Credentials (same as appwrite-setup.mjs) ──────────────────
const APPWRITE_ENDPOINT = 'https://sgp.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '69a2731e00047b3b01e9';
const APPWRITE_API_KEY = 'standard_a22e237c81225a0ddf2b85af6186581642914ff61070b3abf48ed21e79b199566c23d0c7da97d0aae776233d75eefc299b979cac699793e846f5c0d945b1edb3040efc0e5c9093d3235de74df9a6932278ea2cc62548231e8a383229956dbe74d1e529d9a9468ac3d95f29f267a4ecf9be283517243686e63162d1b84bd342cf';

const DATABASE_ID = 'staysetu_db';
const COLLECTION_ID = 'whatsapp_leads';

const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║  📱 StaySetu — WhatsApp Leads Setup         ║');
    console.log('╚══════════════════════════════════════════════╝');

    // 1. Create Collection
    console.log('\n📋 Creating whatsapp_leads collection...');
    try {
        await databases.createCollection(
            DATABASE_ID,
            COLLECTION_ID,
            'WhatsApp Leads',
            [
                Permission.read(Role.any()),       // Anyone can read (for admin panel)
                Permission.create(Role.any()),     // Anyone can create (even guests clicking WhatsApp)
                Permission.update(Role.users()),
                Permission.delete(Role.users()),
            ]
        );
        console.log('   ✅ Collection created');
    } catch (e) {
        if (e.code === 409) console.log('   ⚠️  Collection already exists, continuing...');
        else { console.error('   ❌', e.message); return; }
    }

    // 2. Create Attributes
    console.log('\n📝 Adding attributes...');

    const stringAttrs = [
        ['phoneNumber', 20, true],
        ['listingId', 36, false],
        ['listingTitle', 255, false],
        ['ownerName', 255, false],
        ['clickerUserId', 36, false],
        ['clickerName', 255, false],
        ['clickerEmail', 255, false],
        ['source', 50, false],
        ['message', 1000, false],
    ];

    for (const [key, size, required] of stringAttrs) {
        try {
            await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, key, size, required);
            console.log(`   + ${key} (string, ${size})`);
        } catch (e) {
            if (e.code === 409) console.log(`   ⚠️  ${key} already exists`);
            else console.log(`   ❌ ${key}: ${e.message}`);
        }
        await wait(1500);
    }

    // clickedAt datetime
    try {
        await databases.createDatetimeAttribute(DATABASE_ID, COLLECTION_ID, 'clickedAt', false);
        console.log('   + clickedAt (datetime)');
    } catch (e) {
        if (e.code === 409) console.log('   ⚠️  clickedAt already exists');
        else console.log(`   ❌ clickedAt: ${e.message}`);
    }
    await wait(1500);

    // 3. Create Indexes
    console.log('\n🔑 Adding indexes...');
    await wait(3000); // Wait for attributes

    const indexes = [
        ['phoneNumber', 'key', ['phoneNumber']],
        ['listingId', 'key', ['listingId']],
        ['clickerUserId', 'key', ['clickerUserId']],
        ['clickedAt', 'key', ['clickedAt']],
        ['source', 'key', ['source']],
    ];

    for (const [key, type, attrs] of indexes) {
        try {
            await databases.createIndex(DATABASE_ID, COLLECTION_ID, `idx_${key}`, type, attrs);
            console.log(`   🔑 Index on [${attrs.join(', ')}]`);
        } catch (e) {
            if (e.code === 409) console.log(`   ⚠️  idx_${key} already exists`);
            else console.log(`   ❌ idx_${key}: ${e.message}`);
        }
        await wait(1500);
    }

    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║  ✅  WhatsApp Leads collection is ready!     ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log('\n📊 Every WhatsApp click will now be logged.');
    console.log('   Check the Admin Panel → WhatsApp Leads tab.');
}

main().catch(console.error);
