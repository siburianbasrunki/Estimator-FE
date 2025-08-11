import { NavLink } from "react-router-dom";
import { FiHome } from "react-icons/fi";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

import Logo from "../assets/icon/Logo.svg";
import { FaUserTie, FaSitemap } from "react-icons/fa6";
import { MdOutlinePriceChange, MdOutlineSubtitles } from "react-icons/md";
import { PiProjectorScreenChartDuotone } from "react-icons/pi";
const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: FiHome },
    {
      name: "All Estimation",
      href: "/estimation",
      icon: PiProjectorScreenChartDuotone,
    },
    { name: "HSP(Harga Satuan)", href: "/hsp", icon: MdOutlinePriceChange },
    {
      name: "Category Job",
      href: "/category-job",
      icon: MdOutlineSubtitles,
    },
    {
      name: "Item Job",
      href: "/item-job",
      icon: FaSitemap,
    },
    { name: "User", href: "/users", icon: FaUserTie },
  ];

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-20 bg-white shadow-lg w-64 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="flex items-center flex-row justify-center h-16 px-4 bg-white">
          <img src={Logo} alt="Logo" className="w-10 h-10 mr-2" />
          <h1 className="text-2xl font-bold text-black">Estimator</h1>
        </div>
        <nav className="px-4 py-6">
          <ul className="space-y-2">
            {navigation.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 rounded-lg ${
                      isActive
                        ? "bg-indigo-100 text-indigo-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`
                  }
                  onClick={() => {
                    if (window.innerWidth < 768) {
                      setSidebarOpen(false);
                    }
                  }}
                >
                  <item.icon className="w-6 h-6 mr-3" />
                  <span>{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
