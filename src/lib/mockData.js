// Clean initial storage for StaySetu - Real & live data only
export const INITIAL_LISTINGS = [];
export const INITIAL_ROOMMATES = [];
export const INITIAL_MAIDS = [];
export const INITIAL_REVIEWS = [];

export const DEMO_USERS = {
    student: {
        $id: 'demo_student_id',
        id: 'demo_student_id',
        userId: 'demo_student_id',
        email: 'student@staysetu.com',
        fullName: 'Student User',
        name: 'Student User',
        role: 'student',
        college: '',
        phone: '',
        whatsapp: ''
    },
    owner: {
        $id: 'demo_owner_id',
        id: 'demo_owner_id',
        userId: 'demo_owner_id',
        email: 'owner@staysetu.com',
        fullName: 'Property Owner',
        name: 'Property Owner',
        role: 'owner',
        phone: '',
        whatsapp: ''
    },
    admin: {
        $id: 'demo_admin_id',
        id: 'demo_admin_id',
        userId: 'demo_admin_id',
        email: 'admin@staysetu.com',
        fullName: 'Admin',
        name: 'Admin',
        role: 'admin',
        phone: '',
        whatsapp: ''
    }
};
