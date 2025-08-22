import React, { useState, useEffect, useCallback } from 'react';
import CoinDetailModal from './CoinDetailModal';
import { Popover, Transition } from '@headlessui/react';

// for formatting data display
const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: amount < 1 ? 4 : 2, maximumFractionDigits: amount < 1 ? 8 : 2 }).format(amount);
};
const formatLargeNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    return num.toLocaleString();
};
const formatPercentage = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return value.toFixed(2) + '%';
};

// --- Main App Component ---
export default function App() {
    const [allCryptoData, setAllCryptoData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [globalStats, setGlobalStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // Filter and search state

    const [sortBy, setSortBy] = useState('market_cap');
    const [sortOrder, setSortOrder] = useState('desc');
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state for coin details

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCoin, setSelectedCoin] = useState(null);

    // State for the theme ---
    const [theme, setTheme] = useState('light');

    // Effect to load theme from localStorage and apply it ---
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const userPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (savedTheme) {
            setTheme(savedTheme);
        } else if (userPrefersDark) {
            setTheme('dark');
        }
    }, []);

    // Effect to update HTML class and save to localStorage when theme changes ---
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    const handleOpenModal = (coin) => { setSelectedCoin(coin); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setSelectedCoin(null); };

    // Main data fetching function 
    
    const fetchData = useCallback(async () => {
        if (page === 1) setLoading(true); else setLoadingMore(true);
        setError(null); setIsRefreshing(true);
        try {
            if (page === 1 && !globalStats) {
                const globalRes = await fetch('https://api.coingecko.com/api/v3/global');
                if (!globalRes.ok) throw new Error('API request failed');
                const globalData = await globalRes.json();
                setGlobalStats(globalData.data);
            }
            // Fetch cryptocurrency market data
            const coinsRes = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=${page}&sparkline=false&price_change_percentage=1h%2C24h%2C7d`);
            if (!coinsRes.ok) throw new Error('API request failed');
            const newCoinsData = await coinsRes.json();
            // Check if we've reached the end of available data
            if (newCoinsData.length < 100) setHasMore(false); else setHasMore(true);
            let finalCoinsList = newCoinsData;
            if (page === 1) {
                const vanryRes = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=vanar-chain&price_change_percentage=1h%2C24h%2C7d');
                if (vanryRes.ok) {
                    const vanryData = await vanryRes.json();
                    const filteredInitial = newCoinsData.filter(coin => coin.id !== 'vanar-chain');
                    finalCoinsList = [...vanryData, ...filteredInitial];
                }
            }
            setAllCryptoData(prevData => (page === 1 ? finalCoinsList : [...prevData, ...finalCoinsList]));
        } catch (err) { console.error(err); setError('Failed to load data. Please check your connection.');
        } finally { setLoading(false); setLoadingMore(false); setIsRefreshing(false); }
    }, [page, globalStats]);

    // Trigger data fetch when page changes

    useEffect(() => { fetchData(); }, [fetchData]);

     // Apply filters and sorting whenever data or filters change

    useEffect(() => {
        let dataToProcess = [...allCryptoData];
        // Apply search filter
        if (searchTerm) {
            dataToProcess = dataToProcess.filter(crypto => crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) || crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        // Apply price range filters
        const min = parseFloat(priceRange.min);
        const max = parseFloat(priceRange.max);
        if (!isNaN(min) && min >= 0) { dataToProcess = dataToProcess.filter(c => c.current_price >= min); }
        if (!isNaN(max) && max >= 0) { dataToProcess = dataToProcess.filter(c => c.current_price <= max); }
         // Apply sorting
        const sortKeyMap = { 'market_cap': 'market_cap', 'price': 'current_price', 'change24h': 'price_change_percentage_24h' };
        const sortKey = sortKeyMap[sortBy];
        if (sortKey) {
            dataToProcess.sort((a, b) => {
                const valA = a[sortKey] || -Infinity;
                const valB = b[sortKey] || -Infinity;
                return sortOrder === 'asc' ? valA - valB : valB - valA;
            });
        }
        setFilteredData(dataToProcess);
    }, [searchTerm, allCryptoData, sortBy, sortOrder, priceRange]);

    const getPercentageClass = (value) => (value === null || value === undefined) ? 'text-gray-500 dark:text-gray-400' : value >= 0 ? 'text-green-500' : 'text-red-500';
    const handleLoadMore = () => { if (!loadingMore && hasMore) { setPage(prevPage => prevPage + 1); } };
    // Reset everything to initial state and refresh data
    const handleRefresh = () => { if (page === 1) { fetchData(); } else { setPage(1); } setHasMore(true); setSearchTerm(''); setPriceRange({ min: '', max: '' }); };

    return (
        <div className="min-h-screen bg-[#6A70FC] dark:bg-gray-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/40 to-transparent font-sans text-white p-3 sm:p-6 md:p-8 lg:p-12">
            <div className="max-w-7xl mx-auto">
                {/* App header with theme toggle */}
                <header className="relative text-center mb-8 sm:mb-10 md:mb-12 space-y-3 sm:space-y-4">
                    <div className="absolute top-0 right-0">
                        <button
                            onClick={toggleTheme}
                            className="p-2 sm:p-3 bg-white/15 dark:bg-gray-800/50 rounded-full text-yellow-300 backdrop-blur-lg shadow-lg transition-colors hover:bg-white/25 dark:hover:bg-gray-700/60"
                        >
                            {theme === 'light' ? (
                                <i className="fas fa-moon text-lg sm:text-xl"></i>
                            ) : (
                                <i className="fas fa-sun text-lg sm:text-xl"></i>
                            )}
                        </button>
                    </div>
                    <div className="inline-flex items-center gap-2 sm:gap-3 md:gap-4 bg-white/15 dark:bg-gray-800/50 p-3 sm:p-4 px-4 sm:px-6 md:px-8 rounded-full backdrop-blur-lg shadow-lg">
                        <i className="fab fa-bitcoin text-yellow-300 dark:text-yellow-400 text-xl sm:text-2xl md:text-3xl"></i>
                        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-yellow-300 dark:text-yellow-400">CryptoPulse</h1>
                    </div>
                    <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/80 dark:text-gray-300 px-4">Real-time cryptocurrency prices powered by CoinGecko</p>
                </header>
                 {/* Search, filter, and refresh controls */}
                <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row justify-center items-center gap-2 sm:gap-3 md:gap-4 mb-8 sm:mb-10 md:mb-12 px-2 sm:px-0">
                    <div className="relative w-full sm:max-w-xs md:max-w-sm lg:max-w-lg">
                        <input type="text" placeholder="Search by name or symbol..." className="w-full py-3 sm:py-4 pl-4 sm:pl-6 pr-10 sm:pr-12 text-sm sm:text-base md:text-lg text-white bg-white/10 dark:bg-gray-800/50 rounded-full backdrop-blur-sm placeholder:text-white/60 dark:placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        <i className="fas fa-search absolute right-3 sm:right-4 md:right-5 top-1/2 -translate-y-1/2 text-white/60 dark:text-gray-400 text-sm sm:text-base"></i>
                    </div>
                    <FilterMenu sortBy={sortBy} setSortBy={setSortBy} sortOrder={sortOrder} setSortOrder={setSortOrder} priceRange={priceRange} setPriceRange={setPriceRange} />
                    <button className="flex items-center gap-2 sm:gap-3 py-3 sm:py-4 px-4 sm:px-6 md:px-8 text-sm sm:text-base md:text-lg font-semibold text-gray-800 bg-yellow-400 rounded-full transition-transform hover:scale-105 active:scale-100 shadow-lg w-full sm:w-auto justify-center" onClick={handleRefresh} disabled={isRefreshing}>
                        <i className={`fas fa-sync-alt ${isRefreshing && page === 1 ? 'animate-spin' : ''}`}></i>
                        <span className="hidden sm:inline">Refresh</span>
                        <span className="sm:hidden">Refresh</span>
                    </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 mb-12 sm:mb-14 md:mb-16">
                    <StatCard label="Total Coins" value={globalStats ? globalStats.active_cryptocurrencies.toLocaleString() : '-'} />
                    <StatCard label="Total Market Cap" value={globalStats ? formatLargeNumber(globalStats.total_market_cap.usd) : '-'} />
                    <StatCard label="24h Volume" value={globalStats ? formatLargeNumber(globalStats.total_volume.usd) : '-'} />
                    <StatCard label="BTC Dominance" value={globalStats ? formatPercentage(globalStats.market_cap_percentage.btc) : '-'} />
                </div>
                {/* Loading states and error handling */}
                {loading && page === 1 && <div className="text-center p-6 sm:p-8 md:p-10"><i className="fas fa-spinner text-3xl sm:text-4xl md:text-5xl animate-spin"></i></div>}
                {error && <div className="text-center p-6 sm:p-8 md:p-10 bg-red-500/20 rounded-lg text-red-200 mx-4 sm:mx-0">{error}</div>}
                {(!loading || page > 1) && !error && (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-4 sm:gap-6 md:gap-8 lg:gap-10 px-2 sm:px-0">
                            {filteredData.map(crypto => ( <CryptoCard key={crypto.id} crypto={crypto} getPercentageClass={getPercentageClass} onCardClick={handleOpenModal} /> ))}
                        </div>
                        <div className="text-center mt-8 sm:mt-10 md:mt-12">
                            {hasMore && searchTerm.length === 0 && (
                                <button onClick={handleLoadMore} disabled={loadingMore} className="py-3 sm:py-4 px-6 sm:px-8 text-sm sm:text-base md:text-lg font-semibold text-white bg-white/10 dark:bg-gray-800/50 rounded-full backdrop-blur-sm transition-all hover:bg-white/20 dark:hover:bg-gray-700/60 disabled:opacity-50">
                                    {loadingMore ? 'Loading...' : 'Load More'}
                                </button>
                            )}
                            {!hasMore && searchTerm.length === 0 && <p className="text-white/70 dark:text-gray-400 text-sm sm:text-base">You've reached the end of the list.</p>}
                        </div>
                    </>
                )}
            </div>
            {/* Coin detail modal box */}
            <CoinDetailModal isOpen={isModalOpen} onClose={handleCloseModal} coin={selectedCoin} currentTheme={theme} />
        </div>
    );
}

// --- FilterMenu Component ---
function FilterMenu({ sortBy, setSortBy, sortOrder, setSortOrder, priceRange, setPriceRange }) {
    const sortOptions = [
        { key: 'market_cap', label: 'Market Cap' },
        { key: 'price', label: 'Price' },
        { key: 'change24h', label: '24h Change' },
    ];

    return (
        <Popover as="div" className="relative inline-block text-left w-full sm:w-auto">
            <div>
                <Popover.Button className="flex items-center gap-2 sm:gap-3 py-3 sm:py-4 px-4 sm:px-6 md:px-8 text-sm sm:text-base md:text-lg font-semibold text-white bg-white/10 dark:bg-gray-800/50 rounded-full backdrop-blur-sm transition-all hover:bg-white/20 dark:hover:bg-gray-700/60 w-full sm:w-auto justify-center">
                    <i className="fas fa-filter"></i>
                    Filters
                </Popover.Button>
            </div>
            <Transition
                as={React.Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <Popover.Panel className="absolute right-0 sm:right-auto sm:left-0 z-10 mt-2 w-72 sm:w-80 origin-top-right divide-y divide-gray-600 dark:divide-gray-700 rounded-2xl bg-gray-800 dark:bg-gray-900 shadow-lg ring-1 ring-black/5 focus:outline-none">
                    <div className="p-4">
                        {/* Sort options section */}
                        <p className="text-sm font-medium text-gray-300 dark:text-gray-400 mb-2">Sort By</p>
                        <div className="flex flex-col gap-2">
                            {sortOptions.map(option => (
                                <button
                                    key={option.key}
                                    onClick={() => setSortBy(option.key)}
                                    className={`${
                                        sortBy === option.key ? 'bg-purple-600 text-white' : 'text-gray-200 dark:text-gray-300 hover:bg-purple-500'
                                    } group flex w-full items-center rounded-md px-3 py-2 text-sm font-semibold transition-colors`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                        <div className="mt-4 flex gap-2">
                            <button onClick={() => setSortOrder('desc')} className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${sortOrder === 'desc' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}>High to Low</button>
                            <button onClick={() => setSortOrder('asc')} className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${sortOrder === 'asc' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}>Low to High</button>
                        </div>
                    </div>
                    <div className="p-4">
                         {/* Price range filter section */}
                        <p className="text-sm font-medium text-gray-300 dark:text-gray-400 mb-2">Price Range (USD)</p>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                placeholder="Min"
                                value={priceRange.min}
                                onChange={e => setPriceRange(p => ({...p, min: e.target.value}))}
                                className="w-full bg-gray-700 dark:bg-gray-800 text-white rounded-md p-2 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500 border-none transition-all"
                            />
                            <input
                                type="number"
                                placeholder="Max"
                                value={priceRange.max}
                                onChange={e => setPriceRange(p => ({...p, max: e.target.value}))}
                                className="w-full bg-gray-700 dark:bg-gray-800 text-white rounded-md p-2 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500 border-none transition-all"
                            />
                        </div>
                    </div>
                </Popover.Panel>
            </Transition>
        </Popover>
    );
}

// Statistic display card
const StatCard = ({ label, value }) => (
    <div className="text-center bg-white/10 dark:bg-gray-800/50 p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl backdrop-blur-lg transition-all duration-300 hover:bg-white/20 dark:hover:bg-gray-700/60 hover:shadow-2xl hover:shadow-black/20">
        <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-yellow-300 dark:text-yellow-400 mb-1 sm:mb-2 break-words">{value}</div>
        <div className="text-xs sm:text-sm md:text-base text-white/80 dark:text-gray-300">{label}</div>
    </div>
);

// Individual cryptocurrency card component

const CryptoCard = ({ crypto, getPercentageClass, onCardClick }) => (
    <div 
        onClick={() => onCardClick(crypto)}
        className="relative bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 space-y-3 sm:space-y-4 md:space-y-5 shadow-lg transition-all duration-300 hover:-translate-y-1 sm:hover:-translate-y-2 hover:shadow-2xl dark:hover:shadow-black/40 cursor-pointer"
    >
        <div className="absolute top-0 left-0 right-0 h-1.5 sm:h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-2xl sm:rounded-t-3xl"></div>
        <div className="flex items-center gap-3 sm:gap-4">
            <img src={crypto.image} alt={crypto.name} className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex-shrink-0" />
            <div className="min-w-0 flex-1">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold truncate">{crypto.name}</h3>
                <p className="text-xs sm:text-sm md:text-md text-gray-500 dark:text-gray-400 uppercase">{crypto.symbol}</p>
            </div>
        </div>
        <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white break-words">{formatCurrency(crypto.current_price)}</p>
        <div className="grid grid-cols-2 gap-y-3 sm:gap-y-4 md:gap-y-5 gap-x-2 sm:gap-x-3 md:gap-x-4 pt-3 sm:pt-4 border-t border-gray-100 dark:border-gray-700">
            <DetailItem label="1h Change" value={formatPercentage(crypto.price_change_percentage_1h_in_currency)} valueClass={getPercentageClass(crypto.price_change_percentage_1h_in_currency)} />
            <DetailItem label="24h Change" value={formatPercentage(crypto.price_change_percentage_24h)} valueClass={getPercentageClass(crypto.price_change_percentage_24h)} />
            <DetailItem label="7d Change" value={formatPercentage(crypto.price_change_percentage_7d_in_currency)} valueClass={getPercentageClass(crypto.price_change_percentage_7d_in_currency)} />
            <DetailItem label="Market Cap" value={formatLargeNumber(crypto.market_cap)} />
        </div>
    </div>
);

// Small data display component for crypto card details

const DetailItem = ({ label, value, valueClass = 'text-gray-800 dark:text-gray-100' }) => (
    <div className="min-w-0">
        <p className="text-xs sm:text-sm md:text-base text-gray-500 dark:text-gray-400 truncate">{label}</p>
        <p className={`text-sm sm:text-base md:text-lg font-semibold ${valueClass} truncate`}>{value}</p>
    </div>
);