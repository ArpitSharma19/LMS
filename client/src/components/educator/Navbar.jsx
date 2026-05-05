import React, { useContext } from 'react';
import { assets } from '../../assets/assets';
import { Link } from 'react-router-dom';
import { useStore } from '../../context/AuthContext';

const Navbar = ({ bgColor }) => {

  const { isEducator, user, logout } = useStore()

  return isEducator && user && (
    <div className={`flex items-center justify-between px-4 md:px-8 border-b border-gray-500 py-3 ${bgColor}`}>
      <Link to="/">
        <img src={assets.logo} alt="Logo" className="w-28 lg:w-32" />
      </Link>
      <div className="flex items-center gap-5 text-gray-500 relative">
        <p>Hi! {user.name}</p>
        <div className="flex items-center gap-2">
          {user.imageUrl
            ? <img src={user.imageUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
            : <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                {user.name?.[0]?.toUpperCase()}
              </div>
          }
          <button
            onClick={logout}
            className="text-sm text-red-500 hover:text-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;