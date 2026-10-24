/**
 * Fix Appwrite Storage Bucket - allow proper file extensions
 * Run: node fix-bucket.mjs
 */
import { Client, Storage, Permission, Role } from 'node-appwrite';

const client = new Client()
    .setEndpoint('https://sgp.cloud.appwrite.io/v1')
    .setProject('69a2731e00047b3b01e9')
    .setKey('standard_a22e237c81225a0ddf2b85af6186581642914ff61070b3abf48ed21e79b199566c23d0c7da97d0aae776233d75eefc299b979cac699793e846f5c0d945b1edb3040efc0e5c9093d3235de74df9a6932278ea2cc62548231e8a383229956dbe74d1e529d9a9468ac3d95f29f267a4ecf9be283517243686e63162d1b84bd342cf');

const storage = new Storage(client);
const BUCKET_ID = 'listing-images';

async function fixBucket() {
    console.log('🔧 Fixing storage bucket extensions...');

    try {
        await storage.updateBucket(
            BUCKET_ID,
            'Listing Images',
            [
                Permission.read(Role.any()),
                Permission.create(Role.users()),
                Permission.update(Role.users()),
                Permission.delete(Role.users()),
            ],
            false,      // fileSecurity
            true,       // enabled  
            30000000,   // maximumFileSize (30MB)
            ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'mov', 'avi', 'mkv', 'webm'],  // file EXTENSIONS, not MIME types
            'none',     // compression
            false,      // encryption
            false       // antivirus
        );
        console.log('✅ Bucket updated with correct file extensions!');
    } catch (e) {
        console.log('❌ Error:', e.message);
    }

    // Verify
    const bucket = await storage.getBucket(BUCKET_ID);
    console.log('\n📋 Updated bucket:');
    console.log('   Allowed extensions:', bucket.allowedFileExtensions);
    console.log('   Permissions:', bucket.$permissions);
}

fixBucket();
