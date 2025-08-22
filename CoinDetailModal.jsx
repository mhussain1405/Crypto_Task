import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';

// Register Chart.js components we'll need for the line chart

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
);

export default function CoinDetailModal({ isOpen, onClose, coin, currentTheme }) {
  const [chartData, setChartData] = useState(null);
  const [chartError, setChartError] = useState(false);
  const [days, setDays] = useState(7);

// Fetch chart data whenever modal opens, coin changes, or time period changes

  useEffect(() => {
    if (isOpen && coin) {
      console.log(`%cEFFECT START: Fetching ${days}-day chart for ${coin.name}`, 'color: green; font-weight: bold;');
    
      setChartError(false);
      const fetchChartData = async () => {
        try {
          console.log(`%c  -> Making API call for ${days} days...`, 'color: blue;');
          const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coin.id}/market_chart?vs_currency=usd&days=${days}`);
          if (!response.ok) throw new Error("Failed to fetch chart data");
          
          const data = await response.json();
          
          // Transform API data into Chart.js format

          const formattedData = {
            labels: data.prices.map(price => new Date(price[0]).toLocaleDateString()),
            datasets: [
              {
                label: `Price (USD)`,
                data: data.prices.map(price => price[1]),
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                tension: 0.1,
                fill: true,
              },
            ],
          };
          setChartData(formattedData);
        } catch (error) {
          console.error("Failed to fetch chart data:", error);
          setChartError(true);
        }
      };

      fetchChartData();
    }
  }, [isOpen, coin, days]);

  
  // Chart configuration that adapts to theme and screen size

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
        x: {
            ticks: {
                color: currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                font: {
                    size: window.innerWidth < 640 ? 10 : window.innerWidth < 768 ? 11 : 12
                }
            },
            grid: {
                color: currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            }
        },
        y: {
            ticks: {
                color: currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                font: {
                    size: window.innerWidth < 640 ? 10 : window.innerWidth < 768 ? 11 : 12
                }
            },
            grid: {
                color: currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            }
        }
    },
    plugins: {
        legend: {
            labels: {
                color: currentTheme === 'dark' ? 'white' : 'black',
                font: {
                    size: window.innerWidth < 640 ? 11 : window.innerWidth < 768 ? 12 : 14
                }
            }
        }
    }
  };
  
  if (!coin) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      
      <div className="fixed inset-0 flex w-screen items-center justify-center p-2 sm:p-4">
        
        <Dialog.Panel className="w-full max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl rounded-2xl sm:rounded-3xl bg-white dark:bg-gray-900 p-3 sm:p-4 md:p-6 lg:p-8 shadow-2xl text-gray-800 dark:text-gray-100 max-h-[95vh] overflow-y-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <img src={coin.image} alt={coin.name} className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex-shrink-0" />
            <div className="flex-grow min-w-0">
              <Dialog.Title className="text-xl sm:text-2xl md:text-3xl font-bold truncate">{coin.name}</Dialog.Title>
              <p className="text-sm sm:text-base md:text-lg text-gray-500 dark:text-gray-400 uppercase">{coin.symbol}</p>
            </div>
            
            <button 
                onClick={onClose} 
                className="p-1.5 sm:p-2 rounded-full text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 self-end sm:self-center transition-colors flex-shrink-0"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
          </div>
          
          <div className="mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl md:text-xl font-semibold mb-3 sm:mb-2">Price Chart</h3>
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">

            {/* Chart section */}
            
                {[1, 7, 30, 90, 365].map(d => (
                    <button 
                        key={d}
                        onClick={() => setDays(d)}
                        className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-colors ${
                            days === d 
                                ? 'bg-purple-600 text-white' 
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                    >
                        {d === 1 ? '24H' : d === 365 ? '1Y' : `${d}D`}
                    </button>
                ))}
            </div>

            {/* Chart container with responsive height */}

            <div className="h-48 sm:h-56 md:h-64 lg:h-72">
              {chartError ? (
                <div className="flex items-center justify-center h-full text-red-500 text-sm sm:text-base text-center px-4">
                  Could not load chart data.
                </div>
              ) : chartData ? (
                <Line data={chartData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                  Loading chart...
                </div>
              )}
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}