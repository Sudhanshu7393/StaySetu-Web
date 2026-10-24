/**
 * Creates the `reviews` collection in Appwrite for StaySetu.
 * Run: node create-reviews-collection.mjs
 */

import { Client, Databases } from 'node-appwrite';

const client = new Client()
    .setEndpoint('https://sgp.cloud.appwrite.io/v1')
    .setProject('69a2731e00047b3b01e9')
    .setKey('standard_a22e237c81225a0ddf2b85af6186581642914ff61070b3abf48ed21e79b199566c23d0c7da97d0aae776233d75eefc299b979cac699793e846f5c0d945b1edb3040efc0e5c9093d3235de74df9a6932278ea2cc62548231e8a383229956dbe74d1e529d9a9468ac3d95f29f267a4ecf9be283517243686e63162d1b84bd342cf');

const db = new Databases(client);
const DB = 'staysetu_db';
const COLL = 'reviews';
const wait = (ms) => new Promise(r => setTimeout(r, ms));

async function run() {
    console.log('🚀 Creating reviews collection...\n');

    // 1. Create collection
    try {
        await db.createCollection(DB, COLL, 'reviews', [
            'read("any")',
            'create("users")',
            'update("users")',
            'delete("users")',
        ]);
        console.log('✅ Collection "reviews" created');
    } catch (e) {
        console.log(`⚠️  Collection: ${e.message}`);
    }
    await wait(3000);

    // 2. Attributes
    const attrs = [
        () => db.createStringAttribute(DB, COLL, 'listingId', 36, true),
        () => db.createStringAttribute(DB, COLL, 'userId', 36, true),
        () => db.createStringAttribute(DB, COLL, 'userName', 100, true),
        () => db.createIntegerAttribute(DB, COLL, 'rating', true, 1, 5),
        () => db.createStringAttribute(DB, COLL, 'comment', 500, true),
        () => db.createStringAttribute(DB, COLL, 'createdAt', 50, false),
    ];

    const attrNames = ['listingId', 'userId', 'userName', 'rating', 'comment', 'createdAt'];

    for (let i = 0; i < attrs.length; i++) {
        try {
            await attrs[i]();
            console.log(`✅ reviews.${attrNames[i]} created`);
        } catch (e) {
            console.log(`⚠️  reviews.${attrNames[i]}: ${e.message}`);
        }
        await wait(2000);
    }

    // 3. Indexes
    console.log('\n🔑 Creating indexes...\n');

    try {
        await db.createIndex(DB, COLL, 'idx_listingId', 'key', ['listingId']);
        console.log('✅ reviews.idx_listingId created');
    } catch (e) { console.log(`⚠️  idx_listingId: ${e.message}`); }
    await wait(2000);

    try {
        await db.createIndex(DB, COLL, 'idx_userId', 'key', ['userId']);
        console.log('✅ reviews.idx_userId created');
    } catch (e) { console.log(`⚠️  idx_userId: ${e.message}`); }
    await wait(2000);

    try {
        await db.createIndex(DB, COLL, 'idx_createdAt', 'key', ['createdAt']);
        console.log('✅ reviews.idx_createdAt created');
    } catch (e) { console.log(`⚠️  idx_createdAt: ${e.message}`); }

    console.log('\n🎉 Done! The reviews collection is ready.\n');
}

run();
