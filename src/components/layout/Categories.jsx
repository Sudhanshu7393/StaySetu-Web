import React from 'react';
import { Link } from 'react-router-dom';
import { Bed, Users, Building2, Home, ArrowRight, Landmark, MapPin } from 'lucide-react';

const RENT_CATEGORIES = [
    {
        title: 'Single Room',
        subtitle: 'Private room',
        image: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=600&q=80',
        icon: Bed,
        link: '/listings?purpose=rent&type=PG&occupancy=single',
    },
    {
        title: 'Shared PG',
        subtitle: 'Hostels & PG stays',
        image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&q=80',
        icon: Users,
        link: '/listings?purpose=rent&type=PG',
    },
    {
        title: 'Flat / Apartment',
        subtitle: '1B / 2BHK & RK',
        image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80',
        icon: Building2,
        link: '/listings?purpose=rent&type=Flat',
    },
    {
        title: 'Studio Flat',
        subtitle: 'Compact private home',
        image: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=600&q=80',
        icon: Home,
        link: '/listings?purpose=rent&type=Studio',
    },
];

const SALE_CATEGORIES = [
    {
        title: 'Multistorey Flats',
        subtitle: '2, 3 & 4 BHK Apts',
        image: '/properties/crossings/crossings_republik_towers.jpg',
        icon: Building2,
        link: '/listings?purpose=sell&type=Flat',
    },
    {
        title: 'Independent Villas',
        subtitle: 'Luxury Kothis & Duplex',
        image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=600&q=80',
        icon: Home,
        link: '/listings?purpose=sell&type=House%2FVilla',
    },
    {
        title: 'Residential Plots',
        subtitle: 'Freehold Land & Plots',
        image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80',
        icon: MapPin,
        link: '/listings?purpose=sell&type=Plot',
    },
    {
        title: 'Commercial Spaces',
        subtitle: 'Shops & Office Spaces',
        image: '/properties/crossings/indirapuram_towers.jpg',
        icon: Landmark,
        link: '/listings?purpose=sell&type=Studio',
    },
];

const Categories = ({ purpose = 'rent' }) => {
    const isSale = purpose === 'sell';
    const categories = isSale ? SALE_CATEGORIES : RENT_CATEGORIES;

    return (
        <section className="py-8 sm:py-12 bg-[#FAFAFB]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header Row */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight">
                            {isSale ? 'Explore properties for sale' : 'Explore by room type'}
                        </h2>
                        <p className="text-zinc-500 text-xs sm:text-sm font-normal mt-0.5">
                            {isSale
                                ? 'Find verified apartments, villas, and investment plots.'
                                : 'Find a space that fits your student lifestyle.'}
                        </p>
                    </div>

                    <Link
                        to={isSale ? '/listings?purpose=sell' : '/listings?purpose=rent'}
                        className="text-xs sm:text-sm font-extrabold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors"
                    >
                        <span>View all</span>
                        <ArrowRight size={14} />
                    </Link>
                </div>

                {/* 4 Clean Room/Property Type Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-5">
                    {categories.map((cat) => {
                        const Icon = cat.icon;
                        return (
                            <Link
                                key={cat.title}
                                to={cat.link}
                                className="group relative bg-white rounded-3xl p-3 border border-zinc-200/80 hover:border-rose-300 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col text-center"
                            >
                                {/* Top Image */}
                                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-100 mb-3">
                                    <img
                                        src={cat.image}
                                        alt={cat.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    
                                    {/* Circular Icon Badge */}
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-sm border border-rose-100 flex items-center justify-center text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all">
                                        <Icon size={14} />
                                    </div>
                                </div>

                                {/* Label & Subtitle */}
                                <div className="pt-1.5 pb-1">
                                    <h3 className="font-extrabold text-zinc-900 text-sm group-hover:text-rose-600 transition-colors">
                                        {cat.title}
                                    </h3>
                                    <p className="text-zinc-400 text-[11px] font-normal mt-0.5">
                                        {cat.subtitle}
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </div>

            </div>
        </section>
    );
};

export default Categories;
