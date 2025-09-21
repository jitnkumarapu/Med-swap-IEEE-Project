import React from 'react';
import { Heart, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface HeaderProps {
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle, isMenuOpen = false }) => {
  return (
    <header className="medical-gradient shadow-lg relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent"></div>
      </div>
      
      <div className="relative container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 transform transition-transform hover:scale-105">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">MedSwap</h1>
              <p className="text-white/80 text-sm hidden sm:block">Smart Medicine Finder</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-white/90 hover:text-white transition-colors font-medium">
              Find Medicines
            </Link>
            <Link to="/" className="text-white/90 hover:text-white transition-colors font-medium">
              Alternatives
            </Link>
            <Link to="/about" className="text-white/90 hover:text-white transition-colors font-medium">
              About
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuToggle}
            className="md:hidden text-white hover:bg-white/10"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-white/20 animate-fade-up">
            <nav className="flex flex-col gap-3">
              <Link to="/" className="text-white/90 hover:text-white transition-colors font-medium py-2">
                Find Medicines
              </Link>
              <Link to="/" className="text-white/90 hover:text-white transition-colors font-medium py-2">
                Alternatives
              </Link>
              <Link to="/about" className="text-white/90 hover:text-white transition-colors font-medium py-2">
                About
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;