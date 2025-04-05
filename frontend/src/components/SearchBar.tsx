import React, { useState } from 'react';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  resultCount: number;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchQuery, setSearchQuery, resultCount }) => {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <div className="mb-4">
      <div className={`relative transition-all duration-300 ${isFocused ? 'transform scale-[1.02]' : ''}`}>
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg className={`w-4 h-4 transition-colors duration-300 ${isFocused ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
          </svg>
        </div>
        <input 
          type="search" 
          className="block w-full p-3 pl-10 text-sm text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-shadow duration-300 shadow-sm focus:shadow-md"
          placeholder="Search threats..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {searchQuery && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            onClick={() => setSearchQuery('')}
          >
            <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 12 12M1 13 13 1"/>
            </svg>
            <span className="sr-only">Clear search</span>
          </button>
        )}
      </div>
      <div className="mt-2 flex items-center">
        <div className="flex items-center">
          <div className={`h-2 w-2 rounded-full ${resultCount > 0 ? 'bg-blue-500' : 'bg-green-500'}`}></div>
          <span className="ml-2 text-xs font-medium text-gray-600 dark:text-gray-300">{resultCount > 0 ? `${resultCount} Results Found` : 'No Threats Detected'}</span>
        </div>
        {resultCount > 0 && (
          <div className="ml-auto">
            <button className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              Filter
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
