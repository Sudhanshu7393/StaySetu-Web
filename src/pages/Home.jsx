import React, { useEffect, useState } from 'react';
import Hero from '../components/layout/Hero';
import Categories from '../components/layout/Categories';
import HowItWorks from '../components/layout/HowItWorks';
import EcosystemBenefits from '../components/home/EcosystemBenefits';
import PropertyCard from '../components/common/PropertyCard';
import { databases, DATABASE_ID, COLLECTION, Query, parseJsonField } from '../lib/supabase';
import {
    ArrowRight, ShieldCheck, Zap, Star, Users, Home as HomeIcon,
    Sparkles, CheckCircle2, MessageCircle, MapPin
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
    const [purpose, setPurpose] = useState('rent');
    const [allListings, setAllListings] = useState([]);
    const [filteredListings, setFilteredListings] = useState([]);
    const [selectedCity, setSelectedCity] = useState('All');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        document.title = purpose === 'sell' 
            ? 'StaySetu — Verified Properties for Sale, Flats & Plots'
            : 'StaySetu — Verified Student PGs, Hostels & Roommates';
    }, [purpose]);

    useEffect(() => {
        const fetchAllHomeData = async () => {
            setLoading(true);
            try {
                const res = await databases.listDocuments(
                    DATABASE_ID,
                    COLLECTION.listings,
                    [
                        Query.equal('status', ['approved', 'active']),
                        Query.orderDesc('$createdAt'),
                        Query.limit(50),
                    ]
                );

                const parsed = res.documents.map(item => ({
                    ...item,
                    images: parseJsonField(item.images),
                    amenities: parseJsonField(item.amenities)
                }));
                setAllListings(parsed);
            } catch (err) {
                console.error('Home Page Fetch Error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAllHomeData();
    }, []);

    useEffect(() => {
        let list = allListings;
        if (purpose === 'sell') {
            list = list.filter(item => item.purpose === 'sell' || item.purpose === 'sale' || Number(item.price) >= 500000);
        } else {
            list = list.filter(item => !(item.purpose === 'sell' || item.purpose === 'sale' || Number(item.price) >= 500000));
        }

        if (selectedCity !== 'All') {
            const q = selectedCity.toLowerCase();
            list = list.filter(item => 
                (item.location || '').toLowerCase().includes(q) ||
                (item.title || '').toLowerCase().includes(q)
            );
        }
        setFilteredListings(list);
    }, [purpose, selectedCity, allListings]);

    const handleCityFilter = (city) => {
        setSelectedCity(city);
    };

    return (
        <div className="relative min-h-screen overflow-x-hidden bg-[#FAFAFB] text-zinc-900 pb-16">
            
            {/* 1. Curved Hero Banner */}
            <Hero purpose={purpose} onPurposeChange={setPurpose} />

            {/* 2. Explore by room / property type */}
            <Categories purpose={purpose} />

            {/* 3. Available Rooms / Properties Section */}
            <section className="py-8 sm:py-12 bg-[#FAFAFB]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight">
                                {purpose === 'sell' ? 'Properties for Sale' : 'Available Rooms & Stays'}
                            </h2>
                            <p className="text-zinc-500 text-xs sm:text-sm font-normal mt-0.5">
                                {purpose === 'sell'
                                    ? 'Explore verified flats, luxury villas & plots available for purchase.'
                                    : 'Explore verified student rooms and PGs currently available on StaySetu.'}
                            </p>
                        </div>

                        <Link
                            to={`/listings?purpose=${purpose}`}
                            className="text-xs sm:text-sm font-extrabold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors"
                        >
                            <span>View all</span>
                            <ArrowRight size={14} />
                        </Link>
                    </div>

                    {/* Filter Pills Row */}
                    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 shrink-0">
                            {purpose === 'sell' ? '✓ Verified Real Estate with Direct Contacts' : '✓ Stays in Crossings Republik, Ghaziabad & Pan-India'}
                        </span>
                        {['All', 'Crossings Republik', 'Ghaziabad', 'Noida', 'Delhi NCR', 'Lucknow'].map((loc) => (
                            <button
                                key={loc}
                                onClick={() => handleCityFilter(loc)}
                                className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                                    selectedCity === loc
                                        ? 'bg-rose-500 text-white shadow-xs'
                                        : 'bg-white text-zinc-600 border border-zinc-200/80 hover:bg-zinc-50'
                                }`}
                            >
                                {loc}
                            </button>
                        ))}
                    </div>

                    {/* Property Cards List */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="bg-white rounded-3xl h-44 animate-pulse border border-zinc-200" />
                            ))}
                        </div>
                    ) : filteredListings.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                            {filteredListings.slice(0, 6).map((listing) => (
                                <PropertyCard key={listing.$id || listing.id} property={listing} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 rounded-3xl border border-dashed border-zinc-200 bg-white p-8 max-w-md mx-auto">
                            <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <HomeIcon size={26} />
                            </div>
                            <h3 className="text-base font-extrabold text-zinc-900 mb-1.5">
                                {purpose === 'sell' ? 'No sale properties found in this location' : 'No properties listed yet'}
                            </h3>
                            <p className="text-zinc-500 text-xs sm:text-sm font-normal mb-6 leading-relaxed">
                                {purpose === 'sell'
                                    ? 'Are you a property owner or seller with a flat, villa, or plot to sell? List on StaySetu with direct buyer connects.'
                                    : 'Are you an owner or landlord? List your flat, PG, or property on StaySetu with 100% direct connects.'}
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-3">
                                <Link to={`/dashboard/add-listing?purpose=${purpose}`} className="bg-rose-500 hover:bg-rose-600 text-white font-extrabold py-2.5 px-5 rounded-full text-xs shadow-xs transition-colors">
                                    {purpose === 'sell' ? '+ List Property for Sale' : '+ List Your Property'}
                                </Link>
                                <Link to={`/listings?purpose=${purpose}`} className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-extrabold py-2.5 px-5 rounded-full text-xs transition-colors">
                                    View All {purpose === 'sell' ? 'Sale Listings' : 'Listings'}
                                </Link>
                            </div>
                        </div>
                    )}

                </div>
            </section>

            {/* 4. Real Ecosystem Pillars (Verified Stay, Roommate Finder, Maid Directory) */}
            <EcosystemBenefits />

            {/* 5. How It Works */}
            <HowItWorks />

        </div>
    );
};

export default Home;
