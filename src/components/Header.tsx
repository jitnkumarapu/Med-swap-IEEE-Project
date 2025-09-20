import React from 'react';
import { Heart, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">MedSwap</h1>
              <p className="text-white/80 text-sm hidden sm:block">Smart Medicine Finder</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="text-white/90 hover:text-white transition-colors font-medium">
              Find Medicines
            </a>
            <a href="#" className="text-white/90 hover:text-white transition-colors font-medium">
              Alternatives
            </a>
            <a href="#" className="text-white/90 hover:text-white transition-colors font-medium">
              About
            </a>
            <Button 
              variant="outline" 
              className="bg-white/10 border-white/30 text-white hover:bg-white hover:text-primary backdrop-blur-sm"
            >
              Upload CSV
            </Button>
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
              <a href="#" className="text-white/90 hover:text-white transition-colors font-medium py-2">
                Find Medicines
              </a>
              <a href="#" className="text-white/90 hover:text-white transition-colors font-medium py-2">
                Alternatives
              </a>
              <a href="#" className="text-white/90 hover:text-white transition-colors font-medium py-2">
                About
              </a>
              <Button 
                variant="outline" 
                className="bg-white/10 border-white/30 text-white hover:bg-white hover:text-primary backdrop-blur-sm mt-2"
              >
                Upload CSV
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;