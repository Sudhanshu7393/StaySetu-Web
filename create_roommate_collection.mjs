import { Client, Databases, ID, Permission, Role } from 'node-appwrite';

const client = new Client()
    .setEndpoint('https://sgp.cloud.appwrite.io/v1')
    .setProject('69a2731e00047b3b01e9')
    .setKey('standard_a22e237c81225a0ddf2b85af6186581642914ff61070b3abf48ed21e79b199566c23d0c7da97d0aae776233d75eefc299b979cac699793e846f5c0d945b1edb3040efc0e5c9093d3235de74df9a6932278ea2cc62548231e8a383229956dbe74d1e529d9a9468ac3d95f29f267a4ecf9be283517243686e63162d1b84bd342cf');

const databases = new Databases(client);
const DATABASE_ID = 'staysetu_db';
const COLLECTION_ID = 'roommate_connect_requests';

async function setup() {
    try {
        console.log('Retrieving existing attributes...');
        const collection = await databases.getCollection(DATABASE_ID, COLLECTION_ID);
        const existingKeys = collection.attributes.map(a => a.key);
        console.log('Existing attributes:', existingKeys);

        // Attributes to add
        const attributes = [
            { key: 'roommatePostId', type: 'string', size: 255, required: true },
            { key: 'posterId', type: 'string', size: 255, required: true },
            { key: 'requesterId', type: 'string', size: 255, required: true },
            { key: 'requesterName', type: 'string', size: 255, required: true },
            { key: 'requesterPhone', type: 'string', size: 255, required: true },
            { key: 'status', type: 'string', size: 50, required: true, default: null }, // Removed default since it is required
            { key: 'createdAt', type: 'string', size: 100, required: true },
            { key: 'postLocation', type: 'string', size: 255, required: false },
            { key: 'postCollege', type: 'string', size: 255, required: false }
        ];

        for (const attr of attributes) {
            if (existingKeys.includes(attr.key)) {
                console.log(`Skipping existing attribute: ${attr.key}`);
                continue;
            }
            console.log(`Adding attribute: ${attr.key}`);
            if (attr.type === 'string') {
                await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, attr.key, attr.size, attr.required, attr.default);
            }
            await new Promise(r => setTimeout(r, 1000));
        }

        console.log('Setup complete!');
    } catch (e) {
        console.error('Setup failed:', e);
    }
}

setup();
