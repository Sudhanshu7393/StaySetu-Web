import { Client, Databases, ID, Permission, Role } from 'node-appwrite';

const client = new Client()
    .setEndpoint('https://sgp.cloud.appwrite.io/v1')
    .setProject('69a2731e00047b3b01e9')
    .setKey('standard_a22e237c81225a0ddf2b85af6186581642914ff61070b3abf48ed21e79b199566c23d0c7da97d0aae776233d75eefc299b979cac699793e846f5c0d945b1edb3040efc0e5c9093d3235de74df9a6932278ea2cc62548231e8a383229956dbe74d1e529d9a9468ac3d95f29f267a4ecf9be283517243686e63162d1b84bd342cf');

const databases = new Databases(client);

const samples = [
    {
        title: 'Luxe Student PG',
        description: 'Modern, vibrant studio near campus. Fully furnished with AC and high-speed wifi.',
        price: 12500,
        location: 'Alpha 2, Greater Noida',
        latitude: '28.4674',
        longitude: '77.5143',
        type: 'PG',
        phoneNumber: '9876543210',
        whatsappNumber: '919876543210',
        amenities: JSON.stringify(['WiFi', 'AC', 'Food', 'Parking']),
        images: JSON.stringify(['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80']),
        featured: true,
        genderPreference: 'boys',
        status: 'approved',
        ownerId: '69a27b1e0004ff3b01e9'
    },
    {
        title: 'Premium Girls PG',
        description: 'Secure, comfortable staying with home-style food and 24/7 power backup.',
        price: 8500,
        location: 'Sector 62, Noida',
        latitude: '28.6256',
        longitude: '77.3644',
        type: 'PG',
        phoneNumber: '9876543211',
        whatsappNumber: '919876543211',
        amenities: JSON.stringify(['WiFi', 'Food', 'Laundry', 'Security']),
        images: JSON.stringify(['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80']),
        featured: false,
        genderPreference: 'girls',
        status: 'approved',
        ownerId: '69a27b1e0004ff3b01e9'
    },
    {
        title: 'Elite Student Hostel',
        description: 'Budget-friendly shared accommodation with gym and sports facilities.',
        price: 6500,
        location: 'Knowledge Park II, Greater Noida',
        latitude: '28.4595',
        longitude: '77.4975',
        type: 'Hostel',
        phoneNumber: '9876543212',
        whatsappNumber: '919876543212',
        amenities: JSON.stringify(['WiFi', 'Gym', 'Parking', 'Laundry']),
        images: JSON.stringify(['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1200&q=80']),
        featured: false,
        genderPreference: 'any',
        status: 'approved',
        ownerId: '69a27b1e0004ff3b01e9'
    },
    {
        title: 'Spacious Shared Suite',
        description: 'Large flat for shared living. Prime location near food court.',
        price: 10500,
        location: 'Omega 1, Greater Noida',
        latitude: '28.4514',
        longitude: '77.5222',
        type: 'Flat',
        phoneNumber: '9876543213',
        whatsappNumber: '919876543213',
        amenities: JSON.stringify(['WiFi', 'AC', 'Parking', 'Security']),
        images: JSON.stringify(['https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80']),
        featured: false,
        genderPreference: 'boys',
        status: 'approved',
        ownerId: '69a27b1e0004ff3b01e9'
    }
];

async function seed() {
    console.log('Seeding samples...');
    for (const sample of samples) {
        try {
            await databases.createDocument(
                'staysetu_db',
                'listings',
                ID.unique(),
                {
                    ...sample,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                [
                    Permission.read(Role.any()),
                    Permission.update(Role.any()),
                    Permission.delete(Role.any()),
                ]
            );
            console.log(`✅ Added: ${sample.title}`);
        } catch (e) {
            console.error(`❌ Error adding ${sample.title}:`, e.message);
        }
    }
}

seed();
