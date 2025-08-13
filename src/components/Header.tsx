import { FiMenu, FiUser, FiLogOut } from "react-icons/fi";
import { useProfile } from "../hooks/useProfile";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

const Header = ({ sidebarOpen, setSidebarOpen }: HeaderProps) => {
  const { data: profile, isLoading } = useProfile();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          className="p-1 text-gray-500 rounded-md hover:text-gray-600 hover:bg-gray-100 md:hidden"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle sidebar"
        >
          <FiMenu className="w-6 h-6" />
        </button>

        <div className="flex items-center ml-auto">
          <div className="relative" ref={dropdownRef}>
            <button
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <span className="text-md font-medium text-gray-700">
                {isLoading ? "Loading..." : profile?.name}
              </span>
              <div className="w-10 h-10 overflow-hidden bg-gray-100 rounded-full">
                <FiUser className="w-full h-full p-2 text-gray-400" />
              </div>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 z-20 w-48 mt-2 bg-white rounded-md shadow-lg">
                <div
                  className="flex items-center px-4 py-4 text-sm text-red-500 cursor-pointer hover:bg-gray-100"
                  onClick={handleLogout}
                >
                  <FiLogOut className="w-4 h-4 mr-2 " />
                  Logout
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
