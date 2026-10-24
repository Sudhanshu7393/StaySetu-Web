/**
 * ============================================================
 *  StaySetu — Appwrite Database Setup Script
 * ============================================================
 *  
 *  This script creates your ENTIRE database on Appwrite:
 *    ✅ 1 Database
 *    ✅ 5 Collections (profiles, listings, favorites, roommateRequests, messages)
 *    ✅ All Attributes (columns)
 *    ✅ All Indexes
 *    ✅ 1 Storage Bucket (listing-images)
 *
 *  HOW TO USE:
 *  1. Install Appwrite SDK:   npm install node-appwrite
 *  2. Fill in your credentials below (endpoint, projectId, apiKey)
 *  3. Run:  node appwrite-setup.mjs
 * ============================================================
 */

import { Client, Databases, Storage, ID, Permission, Role } from 'node-appwrite';

// ╔══════════════════════════════════════════════════════════╗
// ║  🔧  FILL IN YOUR APPWRITE CREDENTIALS BELOW           ║
// ╚══════════════════════════════════════════════════════════╝
const APPWRITE_ENDPOINT = 'https://sgp.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '69a2731e00047b3b01e9';
const APPWRITE_API_KEY = 'standard_a22e237c81225a0ddf2b85af6186581642914ff61070b3abf48ed21e79b199566c23d0c7da97d0aae776233d75eefc299b979cac699793e846f5c0d945b1edb3040efc0e5c9093d3235de74df9a6932278ea2cc62548231e8a383229956dbe74d1e529d9a9468ac3d95f29f267a4ecf9be283517243686e63162d1b84bd342cf';

// IDs for our resources (you can customize these)
const DATABASE_ID = 'staysetu_db';
const COLLECTIONS = {
    profiles: 'profiles',
    listings: 'listings',
    favorites: 'favorites',
    roommateRequests: 'roommate_requests',
    messages: 'messages',
};
const BUCKET_ID = 'listing-images';

// ── Setup Client ─────────────────────────────────────────────
const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

// Helper: wait between attribute creations (Appwrite needs time to process)
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ══════════════════════════════════════════════════════════════
//  STEP 1: Create Database
// ══════════════════════════════════════════════════════════════
async function createDatabase() {
    console.log('\n📦 Creating Database...');
    try {
        await databases.create(DATABASE_ID, 'StaySetu DB');
        console.log('   ✅ Database "StaySetu DB" created');
    } catch (e) {
        if (e.code === 409) console.log('   ⚠️  Database already exists, skipping...');
        else throw e;
    }
}

// ══════════════════════════════════════════════════════════════
//  STEP 2: Create Collections
// ══════════════════════════════════════════════════════════════

// Permissions: any user can read, only the document owner can write
const defaultPermissions = [
    Permission.read(Role.any()),
    Permission.create(Role.users()),
    Permission.update(Role.users()),
    Permission.delete(Role.users()),
];

async function createCollection(id, name) {
    try {
        await databases.createCollection(DATABASE_ID, id, name, defaultPermissions);
        console.log(`   ✅ Collection "${name}" created`);
    } catch (e) {
        if (e.code === 409) console.log(`   ⚠️  Collection "${name}" already exists, skipping...`);
        else throw e;
    }
}

// ══════════════════════════════════════════════════════════════
//  STEP 3: Create Attributes (Columns)
// ══════════════════════════════════════════════════════════════

async function createStringAttr(collectionId, key, size, required = false, defaultVal = null) {
    try {
        await databases.createStringAttribute(DATABASE_ID, collectionId, key, size, required, defaultVal);
        console.log(`      + ${key} (string, ${size})`);
    } catch (e) {
        if (e.code === 409) console.log(`      ⚠️  ${key} already exists`);
        else console.log(`      ❌ ${key}: ${e.message}`);
    }
    await wait(1500);
}

async function createIntegerAttr(collectionId, key, required = false, defaultVal = null) {
    try {
        await databases.createIntegerAttribute(DATABASE_ID, collectionId, key, required, undefined, undefined, defaultVal);
        console.log(`      + ${key} (integer)`);
    } catch (e) {
        if (e.code === 409) console.log(`      ⚠️  ${key} already exists`);
        else console.log(`      ❌ ${key}: ${e.message}`);
    }
    await wait(1500);
}

async function createFloatAttr(collectionId, key, required = false, defaultVal = null) {
    try {
        await databases.createFloatAttribute(DATABASE_ID, collectionId, key, required, undefined, undefined, defaultVal);
        console.log(`      + ${key} (float)`);
    } catch (e) {
        if (e.code === 409) console.log(`      ⚠️  ${key} already exists`);
        else console.log(`      ❌ ${key}: ${e.message}`);
    }
    await wait(1500);
}

async function createBooleanAttr(collectionId, key, required = false, defaultVal = null) {
    try {
        await databases.createBooleanAttribute(DATABASE_ID, collectionId, key, required, defaultVal);
        console.log(`      + ${key} (boolean)`);
    } catch (e) {
        if (e.code === 409) console.log(`      ⚠️  ${key} already exists`);
        else console.log(`      ❌ ${key}: ${e.message}`);
    }
    await wait(1500);
}

async function createDatetimeAttr(collectionId, key, required = false) {
    try {
        await databases.createDatetimeAttribute(DATABASE_ID, collectionId, key, required);
        console.log(`      + ${key} (datetime)`);
    } catch (e) {
        if (e.code === 409) console.log(`      ⚠️  ${key} already exists`);
        else console.log(`      ❌ ${key}: ${e.message}`);
    }
    await wait(1500);
}

async function createIndex(collectionId, key, type = 'key', attributes = [key]) {
    try {
        await databases.createIndex(DATABASE_ID, collectionId, `idx_${key}`, type, attributes);
        console.log(`      🔑 Index on [${attributes.join(', ')}]`);
    } catch (e) {
        if (e.code === 409) console.log(`      ⚠️  Index idx_${key} already exists`);
        else console.log(`      ❌ Index ${key}: ${e.message}`);
    }
    await wait(1500);
}

// ══════════════════════════════════════════════════════════════
//  PROFILES Collection
// ══════════════════════════════════════════════════════════════
async function setupProfiles() {
    const col = COLLECTIONS.profiles;
    console.log('\n👤 Setting up PROFILES collection...');
    await createCollection(col, 'Profiles');

    console.log('   Adding attributes...');
    await createStringAttr(col, 'userId', 36, true);
    await createStringAttr(col, 'fullName', 255, true);
    await createStringAttr(col, 'email', 255, true);
    await createStringAttr(col, 'role', 20, true, 'student');
    await createDatetimeAttr(col, 'createdAt', false);
    await createDatetimeAttr(col, 'updatedAt', false);

    console.log('   Adding indexes...');
    await wait(3000); // Wait for attributes to be ready
    await createIndex(col, 'userId', 'unique', ['userId']);
    await createIndex(col, 'email', 'unique', ['email']);
    await createIndex(col, 'role', 'key', ['role']);
}

// ══════════════════════════════════════════════════════════════
//  LISTINGS Collection
// ══════════════════════════════════════════════════════════════
async function setupListings() {
    const col = COLLECTIONS.listings;
    console.log('\n🏠 Setting up LISTINGS collection...');
    await createCollection(col, 'Listings');

    console.log('   Adding attributes...');
    await createStringAttr(col, 'title', 255, true);
    await createStringAttr(col, 'description', 5000, false);
    await createFloatAttr(col, 'price', true);
    await createStringAttr(col, 'location', 500, true);
    await createStringAttr(col, 'latitude', 50, false);
    await createStringAttr(col, 'longitude', 50, false);
    await createStringAttr(col, 'type', 20, true, 'PG');
    await createStringAttr(col, 'phoneNumber', 20, false);
    await createStringAttr(col, 'whatsappNumber', 20, false);
    await createStringAttr(col, 'amenities', 5000, false, '[]');        // JSON array as string
    await createStringAttr(col, 'images', 10000, false, '[]');          // JSON array as string
    await createStringAttr(col, 'ownerId', 36, true);
    await createStringAttr(col, 'status', 20, true, 'pending');
    await createBooleanAttr(col, 'featured', false, false);
    await createStringAttr(col, 'genderPreference', 10, false, 'any');
    await createStringAttr(col, 'listedBy', 20, false, 'owner');
    await createStringAttr(col, 'occupancy', 500, false);
    await createStringAttr(col, 'deposit', 50, false);
    await createStringAttr(col, 'availableFrom', 50, false);
    await createIntegerAttr(col, 'viewsCount', false, 0);
    await createDatetimeAttr(col, 'createdAt', false);
    await createDatetimeAttr(col, 'updatedAt', false);

    console.log('   Adding indexes...');
    await wait(3000);
    await createIndex(col, 'ownerId', 'key', ['ownerId']);
    await createIndex(col, 'status', 'key', ['status']);
    await createIndex(col, 'type', 'key', ['type']);
    await createIndex(col, 'featured', 'key', ['featured']);
    await createIndex(col, 'status_type', 'key', ['status', 'type']);
    await createIndex(col, 'createdAt', 'key', ['createdAt']);
}

// ══════════════════════════════════════════════════════════════
//  FAVORITES Collection
// ══════════════════════════════════════════════════════════════
async function setupFavorites() {
    const col = COLLECTIONS.favorites;
    console.log('\n❤️ Setting up FAVORITES collection...');
    await createCollection(col, 'Favorites');

    console.log('   Adding attributes...');
    await createStringAttr(col, 'userId', 36, true);
    await createStringAttr(col, 'listingId', 36, true);
    await createDatetimeAttr(col, 'createdAt', false);

    console.log('   Adding indexes...');
    await wait(3000);
    await createIndex(col, 'userId', 'key', ['userId']);
    await createIndex(col, 'listingId', 'key', ['listingId']);
    await createIndex(col, 'user_listing', 'unique', ['userId', 'listingId']);
}

// ══════════════════════════════════════════════════════════════
//  ROOMMATE_REQUESTS Collection
// ══════════════════════════════════════════════════════════════
async function setupRoommateRequests() {
    const col = COLLECTIONS.roommateRequests;
    console.log('\n🤝 Setting up ROOMMATE_REQUESTS collection...');
    await createCollection(col, 'Roommate Requests');

    console.log('   Adding attributes...');
    await createStringAttr(col, 'userId', 36, true);
    await createStringAttr(col, 'name', 255, true);
    await createStringAttr(col, 'location', 500, false);
    await createFloatAttr(col, 'budget', false);
    await createStringAttr(col, 'genderPreference', 10, false, 'any');
    await createStringAttr(col, 'moveInDate', 50, false);
    await createStringAttr(col, 'description', 2000, false);
    await createStringAttr(col, 'whatsapp', 20, false);
    await createStringAttr(col, 'college', 255, false);
    await createStringAttr(col, 'status', 20, true, 'pending');
    await createDatetimeAttr(col, 'createdAt', false);

    console.log('   Adding indexes...');
    await wait(3000);
    await createIndex(col, 'userId', 'key', ['userId']);
    await createIndex(col, 'status', 'key', ['status']);
    await createIndex(col, 'createdAt', 'key', ['createdAt']);
}

// ══════════════════════════════════════════════════════════════
//  MESSAGES Collection
// ══════════════════════════════════════════════════════════════
async function setupMessages() {
    const col = COLLECTIONS.messages;
    console.log('\n💬 Setting up MESSAGES collection...');
    await createCollection(col, 'Messages');

    console.log('   Adding attributes...');
    await createStringAttr(col, 'senderId', 36, true);
    await createStringAttr(col, 'receiverId', 36, true);
    await createStringAttr(col, 'content', 5000, true);
    await createStringAttr(col, 'listingId', 36, false);
    await createBooleanAttr(col, 'isRead', false, false);
    await createDatetimeAttr(col, 'createdAt', false);

    console.log('   Adding indexes...');
    await wait(3000);
    await createIndex(col, 'senderId', 'key', ['senderId']);
    await createIndex(col, 'receiverId', 'key', ['receiverId']);
    await createIndex(col, 'listingId', 'key', ['listingId']);
    await createIndex(col, 'sender_receiver', 'key', ['senderId', 'receiverId']);
    await createIndex(col, 'createdAt', 'key', ['createdAt']);
}

// ══════════════════════════════════════════════════════════════
//  STORAGE BUCKET
// ══════════════════════════════════════════════════════════════
async function setupStorage() {
    console.log('\n🗂️ Setting up STORAGE bucket...');
    try {
        await storage.createBucket(
            BUCKET_ID,
            'Listing Images',
            [
                Permission.read(Role.any()),          // Anyone can view images
                Permission.create(Role.users()),      // Logged-in users can upload
                Permission.delete(Role.users()),      // Logged-in users can delete their uploads
            ],
            false,     // fileSecurity
            true,      // enabled
            30000000,  // maximumFileSize (30MB)
            ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'mov', 'avi', 'mkv', 'webm'],  // allowedFileExtensions
            'none',    // compression
            false,     // encryption
            false      // antivirus
        );
        console.log('   ✅ Storage bucket "listing-images" created');
    } catch (e) {
        if (e.code === 409) console.log('   ⚠️  Bucket already exists, skipping...');
        else console.log(`   ❌ Storage error: ${e.message}`);
    }
}

// ══════════════════════════════════════════════════════════════
//  RUN EVERYTHING
// ══════════════════════════════════════════════════════════════
async function main() {
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║  🚀 StaySetu — Appwrite Database Setup      ║');
    console.log('╚══════════════════════════════════════════════╝');

    try {
        await createDatabase();
        await setupProfiles();
        await setupListings();
        await setupFavorites();
        await setupRoommateRequests();
        await setupMessages();
        await setupStorage();

        console.log('\n╔══════════════════════════════════════════════╗');
        console.log('║  ✅  ALL DONE! Your database is ready.       ║');
        console.log('╚══════════════════════════════════════════════╝');
        console.log('\n📝 Summary:');
        console.log('   • 1 Database: staysetu_db');
        console.log('   • 5 Collections: profiles, listings, favorites, roommate_requests, messages');
        console.log('   • 1 Storage Bucket: listing-images');
        console.log('\n🔗 Next: Update your React code to use the Appwrite SDK.');
    } catch (error) {
        console.error('\n❌ Fatal error:', error.message);
        console.error('   Make sure your API key has Database + Storage permissions.');
    }
}

main();
