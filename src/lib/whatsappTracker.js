/**
 * StaySetu Concierge Lead Tracker & WhatsApp Router
 * Routes incoming inquiries through StaySetu Official Desk (+91 7393011350)
 * so StaySetu captures student details, introduces them to the owner,
 * and maintains a reliable record for follow-ups and reviews.
 */
import { databases, DATABASE_ID, ID, Permission, Role } from './supabase';

export const WHATSAPP_LEADS_COLLECTION = 'whatsapp_leads';
export const STAYSETU_OFFICIAL_PHONE = '917393011350';

/**
 * Normalize Indian phone numbers to international WhatsApp format (with 91 country code).
 */
export function normalizeWhatsAppNumber(phoneNumber) {
    let clean = (phoneNumber || '').toString().replace(/\D/g, '');
    if (!clean) return '';
    if (clean.length === 10) {
        clean = '91' + clean;
    } else if (clean.length === 11 && clean.startsWith('0')) {
        clean = '91' + clean.slice(1);
    }
    return clean;
}

/**
 * Track an inquiry / WhatsApp contact click in Supabase database.
 */
export async function trackWhatsAppClick({
    studentPhone = '',
    studentName = '',
    studentEmail = '',
    listingId = '',
    listingTitle = '',
    listingLocation = '',
    ownerName = '',
    ownerPhone = '',
    source = 'inquiry_modal',
    message = '',
    status = 'new',
}) {
    try {
        const cleanStudentPhone = (studentPhone || '').replace(/\D/g, '').slice(0, 15);
        const cleanOwnerPhone = (ownerPhone || '').replace(/\D/g, '').slice(0, 15);

        return await databases.createDocument(
            DATABASE_ID,
            WHATSAPP_LEADS_COLLECTION,
            ID.unique(),
            {
                // Student info
                studentPhone: cleanStudentPhone || 'Not provided',
                studentName: (studentName || 'Student').slice(0, 255),
                studentEmail: (studentEmail || '').slice(0, 255),
                clickerName: (studentName || 'Student').slice(0, 255),
                clickerEmail: (studentEmail || '').slice(0, 255),

                // Property & Owner info
                listingId: listingId || '',
                listingTitle: (listingTitle || 'StaySetu Property').slice(0, 255),
                listingLocation: (listingLocation || '').slice(0, 255),
                ownerName: (ownerName || 'Owner').slice(0, 255),
                ownerPhone: cleanOwnerPhone || '',
                phoneNumber: cleanOwnerPhone || '', // Backward-compatibility

                // Metadata
                source: source.slice(0, 50),
                message: (message || '').slice(0, 1000),
                status: status || 'new', // 'new' | 'forwarded' | 'visited' | 'reviewed'
                clickedAt: new Date().toISOString(),
            },
            [
                Permission.read(Role.any()),
            ]
        );
    } catch (err) {
        console.error('WhatsApp lead tracking failed:', err);
        return null;
    }
}

/**
 * Open WhatsApp with StaySetu Official Desk (+91 7393011350)
 * Student sends inquiry directly to StaySetu!
 */
export function openStaySetuDeskWhatsApp(message) {
    let encodedMessage = message || '';
    try {
        if (decodeURIComponent(message) === message) {
            encodedMessage = encodeURIComponent(message);
        }
    } catch {
        encodedMessage = encodeURIComponent(message);
    }
    window.open(`https://wa.me/${STAYSETU_OFFICIAL_PHONE}?text=${encodedMessage}`, '_blank');
}

/**
 * Admin action: Forward verified student lead to Owner on WhatsApp
 */
export function forwardLeadToOwner({ ownerPhone, ownerName, studentName, studentPhone, studentCollege, listingTitle, moveIn, requestedSlot }) {
    const cleanNumber = normalizeWhatsAppNumber(ownerPhone);
    if (!cleanNumber) {
        alert('Owner phone number is not available for this listing.');
        return;
    }

    const forwardMessage = 
`Namaste ${ownerName || 'ji'}! 🙏

StaySetu se verified student lead aayi hai aapki property ke liye:
🏡 Property: "${listingTitle || 'Your StaySetu Listing'}"

👤 Student Name: ${studentName || 'Student'}
📞 Student Phone: ${studentPhone || 'Contact details provided'}
${studentCollege ? `🎓 College: ${studentCollege}\n` : ''}${requestedSlot ? `⏰ Preferred Visit Time: ${requestedSlot}\n` : ''}${moveIn ? `🗓️ Move-in Timeline: ${moveIn}\n` : ''}
Kripya student se connect karke room visit coordinate kar lijiye.
Dhanyawad,
StaySetu Team (+91 7393011350)`;

    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(forwardMessage)}`, '_blank');
}

/**
 * Admin action: Call or WhatsApp Student for Follow-up & Review
 */
export function contactStudentForReview({ studentPhone, studentName, listingTitle }) {
    const cleanNumber = normalizeWhatsAppNumber(studentPhone);
    if (!cleanNumber) {
        alert('Student phone number is not available.');
        return;
    }

    const reviewMessage = 
`Hi ${studentName || 'there'}! 👋 

StaySetu se Sudhanshu baat kar raha hoon.
Aapne "${listingTitle || 'property'}" ke liye visit request ki thi.

Aapka visit kaisa raha? Room aur facilities pasand aayi?
Aapka genuine feedback hamare liye bohot valuable hai!`;

    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(reviewMessage)}`, '_blank');
}

/**
 * Generic open WhatsApp helper (with country code normalization)
 */
export function openWhatsApp(phoneNumber, message) {
    const cleanNumber = normalizeWhatsAppNumber(phoneNumber || STAYSETU_OFFICIAL_PHONE);
    let encodedMessage = message || '';
    try {
        if (decodeURIComponent(message) === message) {
            encodedMessage = encodeURIComponent(message);
        }
    } catch {
        encodedMessage = encodeURIComponent(message);
    }
    window.open(`https://wa.me/${cleanNumber}?text=${encodedMessage}`, '_blank');
}
