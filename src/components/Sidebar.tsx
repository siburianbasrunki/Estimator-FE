import { NavLink, useLocation } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { FiHome, FiChevronDown } from "react-icons/fi";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

import Logo from "../assets/icon/Icon.png";
import { FaUserTie, FaPeopleCarryBox } from "react-icons/fa6";
import {
  MdOutlinePriceChange,
  MdOutlineSubtitles,
  MdSource,
} from "react-icons/md";
import { FaTools } from "react-icons/fa";
import { PiProjectorScreenChartDuotone } from "react-icons/pi";
import { GiStakeHammer } from "react-icons/gi";
import { SiMaterialdesignicons } from "react-icons/si";
import { useProfile } from "../hooks/useProfile";

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  show?: boolean;
};

type NavGroup = {
  title: string;
  key: string;
  items: NavItem[];
  show?: boolean;
};

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const { data: profile } = useProfile();
  const isAdmin = profile?.role === "ADMIN";
  const location = useLocation();

  const singles: NavItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: FiHome, show: true },
    {
      name: "Rancangan Biaya",
      href: "/estimation",
      icon: PiProjectorScreenChartDuotone,
      show: true,
    },
    {
      name: "Manajemen User",
      href: "/users",
      icon: FaUserTie,
      show: isAdmin,
    },
  ];

  const groups: NavGroup[] = useMemo(
    () => [
      {
        title: "HSP & Kategori",
        key: "hsp-kategori",
        show: true,
        items: [
          {
            name: "HSP (Harga Satuan)",
            href: "/hsp",
            icon: MdOutlinePriceChange,
            show: true,
          },
          {
            name: "Kategori Pekerjaan",
            href: "/category-job",
            icon: MdOutlineSubtitles,
            show: true,
          },
          {
            name: "Manajemen Sumber HSP",
            href: "/source",
            icon: MdSource,
            // show: isAdmin,
          },
          {
            name: "Manajement Units",
            href: "/units",
            icon: SiMaterialdesignicons,
            // show: isAdmin,
          },
        ],
      },
      {
        title: "Master Data",
        key: "master-data",
        show: true,
        items: [
          {
            name: "Upah Kerja",
            href: "/master/upah",
            icon: FaPeopleCarryBox,
            show: true,
          },
          {
            name: "Bahan Material",
            href: "/master/bahan",
            icon: GiStakeHammer,
            show: true,
          },
          {
            name: "Peralatan",
            href: "/master/peralatan",
            icon: FaTools,
            show: true,
          },
        ],
      },
    ],
    [isAdmin]
  );

  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const next: Record<string, boolean> = {};
    groups.forEach((g) => {
      const active = g.items
        .filter((i) => i.show !== false)
        .some((i) => location.pathname.startsWith(i.href));
      next[g.key] = active || open[g.key] || false;
    });
    setOpen((prev) => ({ ...prev, ...next }));
  }, [location.pathname, groups]);

  const toggle = (key: string) => setOpen((s) => ({ ...s, [key]: !s[key] }));

  const ItemLink = ({ item }: { item: NavItem }) => (
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
        if (window.innerWidth < 768) setSidebarOpen(false);
      }}
    >
      <item.icon className="w-5 h-5 mr-3 shrink-0" />
      <span className="truncate">{item.name}</span>
    </NavLink>
  );

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`
          fixed inset-y-0 left-0 z-20 bg-white shadow-lg transition-transform duration-300 ease-in-out
          w-64 md:w-56 lg:w-64
          ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0
          flex flex-col   /* ⟵ penting: kolom penuh */
        `}
      >
        <div className="sticky top-0 z-10 bg-white">
          <div className="flex items-center flex-row justify-center h-16 px-4 bg-white">
            {" "}
            <img src={Logo} alt="Logo" className="w-60 h-39 mr-2 mt-1" />{" "}
          </div>
          <div className="h-px bg-gray-200" />
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-4">
          <ul className="space-y-2">
            {singles
              .filter((i) => i.show !== false)
              .map((item) => (
                <li key={item.name}>
                  <ItemLink item={item} />
                </li>
              ))}

            {groups
              .filter((g) => g.show !== false)
              .map((group) => {
                const visibleItems = group.items.filter(
                  (i) => i.show !== false
                );
                if (visibleItems.length === 0) return null;

                const groupActive = visibleItems.some((i) =>
                  location.pathname.startsWith(i.href)
                );

                return (
                  <li key={group.key} className="border-t pt-3">
                    <button
                      type="button"
                      onClick={() => toggle(group.key)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md ${
                        groupActive
                          ? "bg-indigo-50 text-indigo-700"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-sm font-semibold">
                        {group.title}
                      </span>
                      <FiChevronDown
                        className={`transition-transform ${
                          open[group.key] ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <div
                      className={`
                        grid transition-[grid-template-rows] duration-300
                        ${
                          open[group.key]
                            ? "grid-rows-[1fr]"
                            : "grid-rows-[0fr]"
                        }
                      `}
                    >
                      <div className="overflow-hidden">
                        <ul className="mt-2 space-y-2 pl-2">
                          {visibleItems.map((item) => (
                            <li key={item.name}>
                              <ItemLink item={item} />
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </li>
                );
              })}
          </ul>
        </nav>

        <div className="h-2 md:h-3" />
      </div>
    </>
  );
};

export default Sidebar;
