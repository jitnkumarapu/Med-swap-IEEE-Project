import React, { useState, useEffect } from 'react';
import { Search, X, Pill, Activity } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  onSearch: (query: string) => void;
  suggestions?: string[];
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  suggestions = [], 
  placeholder = "Search medicines, salts, or conditions..." 
}) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (query.length > 1) {
      const filtered = suggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredSuggestions(filtered.slice(0, 5));
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [query, suggestions]);

  const handleSearch = (searchQuery: string = query) => {
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  const clearSearch = () => {
    setQuery('');
    setShowSuggestions(false);
    onSearch('');
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Search Input Container */}
      <div className="search-medical flex items-center gap-3 p-4">
        <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder={placeholder}
          className="border-0 bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="p-1 h-auto hover:bg-muted/50"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
        <Button
          onClick={() => handleSearch()}
          className="btn-medical text-primary-foreground px-6 py-2 font-medium"
          disabled={!query.trim()}
        >
          Search
        </Button>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex items-center gap-3 border-b border-border/50 last:border-b-0"
            >
              <div className="w-2 h-2 rounded-full bg-primary/30"></div>
              <span className="text-sm text-foreground">{suggestion}</span>
            </button>
          ))}
        </div>
      )}

      {/* Quick Search Tags */}
      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        {['Paracetamol', 'Fever', 'Headache', 'Antibiotics', 'Blood pressure'].map((tag) => (
          <button
            key={tag}
            onClick={() => handleSuggestionClick(tag)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full transition-colors"
          >
            {tag === 'Fever' ? <Activity className="w-3 h-3" /> : <Pill className="w-3 h-3" />}
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchBar;