'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, ArrowRight, Users, Package, Truck, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'customer' | 'product' | 'agent' | 'order' | 'invoice' | 'route';
  url: string;
  icon: React.ComponentType<any>;
}

interface GlobalSearchProps {
  className?: string;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ className = '' }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Mock search function - replace with actual API call
  const performSearch = async (searchQuery: string): Promise<SearchResult[]> => {
    if (!searchQuery.trim()) return [];
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const mockResults = [
      {
        id: '1',
        title: 'John Doe Electronics',
        subtitle: 'Customer • Lagos, Nigeria',
        type: 'customer' as const,
        url: '/customers/1',
        icon: Users
      },
      {
        id: '2',
        title: 'Coca-Cola 500ml',
        subtitle: 'Product • Beverages',
        type: 'product' as const,
        url: '/products/2',
        icon: Package
      },
      {
        id: '3',
        title: 'Agent Mike Johnson',
        subtitle: 'Van Sales • Territory A',
        type: 'agent' as const,
        url: '/agents/3',
        icon: Truck
      },
      {
        id: '4',
        title: 'Order #ORD-2024-001',
        subtitle: 'Pending • ₦45,000',
        type: 'order' as const,
        url: '/orders/4',
        icon: FileText
      }
    ].filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
    ) as SearchResult[];

    return mockResults;
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (query.trim()) {
        setLoading(true);
        try {
          const searchResults = await performSearch(query);
          setResults(searchResults);
        } catch (error) {
          console.error('Search error:', error);
          setResults([]);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && results[selectedIndex]) {
            handleResultClick(results[selectedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          inputRef.current?.blur();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (result: SearchResult) => {
    // Add to recent searches
    const newRecentSearches = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(newRecentSearches);
    localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches));

    // Navigate to result
    router.push(result.url);
    setIsOpen(false);
    setQuery('');
  };

  const handleRecentSearchClick = (recentQuery: string) => {
    setQuery(recentQuery);
    inputRef.current?.focus();
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const getTypeColor = (type: string) => {
    const colors = {
      customer: 'text-blue-600 bg-blue-50',
      product: 'text-green-600 bg-green-50',
      agent: 'text-purple-600 bg-purple-50',
      order: 'text-orange-600 bg-orange-50',
      invoice: 'text-red-600 bg-red-50',
      route: 'text-indigo-600 bg-indigo-50'
    };
    return colors[type as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search customers, products, orders..."
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
          {loading && (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm">Searching...</p>
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No results found for "{query}"</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="py-2">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Search Results
              </div>
              {results.map((result, index) => {
                const Icon = result.icon;
                return (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className={`w-full px-3 py-3 text-left hover:bg-gray-50 flex items-center gap-3 ${
                      index === selectedIndex ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${getTypeColor(result.type)}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {result.title}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {result.subtitle}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </button>
                );
              })}
            </div>
          )}

          {!query && recentSearches.length > 0 && (
            <div className="py-2">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Recent Searches
                </span>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Clear
                </button>
              </div>
              {recentSearches.map((recentQuery, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentSearchClick(recentQuery)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                >
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{recentQuery}</span>
                </button>
              ))}
            </div>
          )}

          {!query && recentSearches.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Start typing to search...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};