import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 dark:bg-black text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">HS</span>
              </div>
              <span className="text-xl font-bold">HireSense AI</span>
            </div>
            <p className="text-gray-400 text-sm">
              AI-powered resume analysis and interview preparation platform.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="#features" className="hover:text-white transition">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white transition">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#demo" className="hover:text-white transition">
                  Demo
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="#about" className="hover:text-white transition">
                  About
                </a>
              </li>
              <li>
                <a href="#blog" className="hover:text-white transition">
                  Blog
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-white transition">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="#privacy" className="hover:text-white transition">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#terms" className="hover:text-white transition">
                  Terms
                </a>
              </li>
              <li>
                <a href="#cookies" className="hover:text-white transition">
                  Cookies
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 py-8">
          <p className="text-center text-gray-400 text-sm">
            &copy; {currentYear} HireSense AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
