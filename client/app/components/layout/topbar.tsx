import { BellIcon, ChevronDownIcon, MenuIcon, SearchIcon } from "../icons";

type TopbarProps = {
  onMenuClick: () => void;
};

export function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-4 border-b border-gray-200 bg-white/80 px-4 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white lg:hidden"
      >
        <MenuIcon className="size-5" />
      </button>

      <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
        Dashboard
      </h1>

      <div className="ml-auto flex items-center gap-3">
        <label className="relative hidden md:block">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search..."
            className="w-56 rounded-lg border border-gray-200 bg-gray-50 py-1.5 pr-3 pl-9 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </label>

        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        >
          <BellIcon className="size-5" />
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-gray-900" />
        </button>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-800" />

        <button
          type="button"
          className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <div className="flex size-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
            RH
          </div>
          <span className="hidden text-sm font-medium text-gray-700 dark:text-gray-200 sm:block">
            Rezaul
          </span>
          <ChevronDownIcon className="hidden size-4 text-gray-400 sm:block" />
        </button>
      </div>
    </header>
  );
}
