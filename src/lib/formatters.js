// Price and property formatting utilities for StaySetu

export const formatPropertyPrice = (price, purpose = 'rent') => {
    const num = Number(price);
    if (!price || isNaN(num)) return '₹0';

    const isSale = purpose === 'sell' || purpose === 'sale' || num >= 500000;

    if (isSale) {
        if (num >= 10000000) {
            const cr = (num / 10000000).toFixed(2).replace(/\.00$/, '');
            return `₹${cr} Cr`;
        }
        if (num >= 100000) {
            const lac = (num / 100000).toFixed(2).replace(/\.00$/, '');
            return `₹${lac} Lac`;
        }
        return `₹${num.toLocaleString('en-IN')}`;
    }

    return `₹${num.toLocaleString('en-IN')}`;
};

export const getPropertyTypeLabel = (type) => {
    switch (type) {
        case 'House/Villa':
            return 'Villa / Kothi';
        case 'Plot':
            return 'Residential Plot';
        case 'Flat':
            return 'Apartment';
        case 'PG':
            return 'Student PG';
        case 'Hostel':
            return 'Hostel';
        case 'Studio':
            return 'Studio Flat';
        default:
            return type || 'Stay';
    }
};
