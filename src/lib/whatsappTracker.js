/**
 * WhatsApp Lead Tracker
 * Logs every "Contact via WhatsApp" click so the admin can see
 * who contacted which property owner (broker).
 */
import { databases, DATABASE_ID, ID, Permission, Role } from './supabase';

export const WHATSAPP_LEADS_COLLECTION = 'whatsapp_leads';

/**
 * Track a WhatsApp contact click and then open the WhatsApp link.
 *
 * @param {Object} params
 * @param {string} params.phoneNumber    — owner/broker phone number being contacted
 * @param {string} params.listingId      — listing document ID (optional for roommates)
 * @param {string} params.listingTitle   — listing title
 * @param {string} params.ownerName      — owner/broker name
 * @param {string} params.clickerUserId  — logged-in user's $id (null if guest)
 * @param {string} params.clickerName    — logged-in user's name (null if guest)
 * @param {string} params.clickerEmail   — logged-in user's email (null if guest)
 * @param {string} params.source         — where the click happened: 'property_details' | 'property_card' | 'roommate' | 'student_dashboard'
 * @param {string} params.message        — the pre-filled WhatsApp message
 */
export async function trackWhatsAppClick({
    phoneNumber,
    listingId = '',
    listingTitle = '',
    ownerName = '',
    clickerUserId = '',
    clickerName = '',
    clickerEmail = '',
    source = 'unknown',
    message = '',
}) {
    // Fire-and-forget: don't block the user from opening WhatsApp
    try {
        await databases.createDocument(
            DATABASE_ID,
            WHATSAPP_LEADS_COLLECTION,
            ID.unique(),
            {
                phoneNumber: (phoneNumber || '').replace(/\D/g, '').slice(0, 20) || 'unknown',
                listingId: listingId || '',
                listingTitle: (listingTitle || '').slice(0, 255),
                ownerName: (ownerName || '').slice(0, 255),
                clickerUserId: clickerUserId || 'guest',
                clickerName: (clickerName || 'Guest').slice(0, 255),
                clickerEmail: (clickerEmail || '').slice(0, 255),
                source: source.slice(0, 50),
                message: (message || '').slice(0, 1000),
                clickedAt: new Date().toISOString(),
            },
            [
                Permission.read(Role.any()),
            ]
        );
    } catch (err) {
        // Never block the main flow — just log the error
        console.error('WhatsApp lead tracking failed:', err);
    }
}

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
 * Open WhatsApp after tracking the click.
 */
export function openWhatsApp(phoneNumber, message) {
    const cleanNumber = normalizeWhatsAppNumber(phoneNumber);
    if (!cleanNumber) {
        alert('Contact number not available for this listing.');
        return;
    }
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
