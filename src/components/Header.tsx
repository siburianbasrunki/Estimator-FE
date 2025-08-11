import { FiMenu, FiUser } from 'react-icons/fi'

interface HeaderProps {
  sidebarOpen: boolean
  setSidebarOpen: (arg: boolean) => void
}

const Header = ({ sidebarOpen, setSidebarOpen }: HeaderProps) => {
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
          <button className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Admin</span>
            <div className="w-8 h-8 overflow-hidden bg-gray-100 rounded-full">
              <FiUser className="w-full h-full p-2 text-gray-400" />
            </div>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header;