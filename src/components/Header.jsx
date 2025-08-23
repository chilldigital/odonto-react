import React from 'react';

export default function Header({ title, setSidebarOpen }) {
  return (
    <div className="bg-white border-b px-4 lg:px-8 py-4 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-600 hover:text-gray-900">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <h1 className="text-xl lg:text-2xl font-semibold text-gray-800">{title}</h1>
      </div>
      <div className="flex items-center space-x-4">
        <div className="w-8 h-8 lg:w-10 lg:h-10 bg-orange-100 rounded-full flex items-center justify-center">
          <div className="w-6 h-6 lg:w-8 lg:h-8 bg-orange-200 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}