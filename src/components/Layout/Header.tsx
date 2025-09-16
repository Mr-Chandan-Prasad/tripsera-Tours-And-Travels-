import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plane, Menu, X } from 'lucide-react';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Journey', href: '/' },
    { name: 'Where to Next?', href: '/destinations' },
    { name: 'Add-Ons', href: '/services' },
    { name: 'Memories', href: '/gallery' },
    { name: 'Your Trips', href: '/my-bookings' },
    { name: 'Plan & Reserve', href: '/bookings' },
    { name: 'Let’s Connect', href: '/contact' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed w-full top-0 z-50 bg-gradient-to-r from-blue-900 to-purple-800 shadow-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2 text-white">
            <Plane className="w-8 h-8 text-orange-400" />
            <span className="text-2xl font-bold">
              <span className="bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                Tripsera
              </span>
              <span className="ml-1">Travels</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-lg font-semibold transition-all duration-300 hover:text-orange-400 hover:scale-110 ${
                  isActive(item.href) ? 'text-orange-400 underline' : 'text-white'
                }`}
              >
                {item.name}
              </Link>
            ))}
            {/* <Link
              to="/admin"
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-all duration-300 hover:scale-105"
            >
              🛠 Boss Mode
            </Link> */}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white focus:outline-none"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 border-t border-purple-700">
            <div className="flex flex-col space-y-4 pt-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`text-lg font-semibold transition-colors duration-300 ${
                    isActive(item.href) ? 'text-orange-400' : 'text-white hover:text-orange-400'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <Link
                to="/admin"
                onClick={() => setIsMenuOpen(false)}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors duration-300 text-center"
              >
                Admin
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;