import { NavLink } from "react-router";
import {
  AnalyticsIcon,
  ChatIcon,
  CloseIcon,
  DashboardIcon,
  SettingsIcon,
  TeamIcon,
  UploadIcon,
} from "../icons";

const NAV_ITEMS = [
  { label: "Dashboard", icon: DashboardIcon, to: "/" },
  { label: "Uploads", icon: UploadIcon, to: "/uploads" },
  { label: "Messages", icon: ChatIcon, to: null },
  { label: "Team", icon: TeamIcon, to: null },
  { label: "Analytics", icon: AnalyticsIcon, to: null },
  { label: "Settings", icon: SettingsIcon, to: null },
];

const NAV_ITEM_BASE_CLASSES =
  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors";
const NAV_ITEM_ACTIVE_CLASSES =
  "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400";
const NAV_ITEM_INACTIVE_CLASSES =
  "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-gray-900/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-gray-200 bg-white transition-transform duration-200 ease-in-out dark:border-gray-800 dark:bg-gray-900 lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-gray-200 px-5 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              A
            </div>
            <span className="text-base font-semibold text-gray-900 dark:text-white">
              Admin
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white lg:hidden"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map(({ label, icon: Icon, to }) =>
            to ? (
              <NavLink
                key={label}
                to={to}
                end={to === "/"}
                onClick={onClose}
                className={({ isActive }) =>
                  `${NAV_ITEM_BASE_CLASSES} ${
                    isActive ? NAV_ITEM_ACTIVE_CLASSES : NAV_ITEM_INACTIVE_CLASSES
                  }`
                }
              >
                <Icon className="size-5 shrink-0" />
                {label}
              </NavLink>
            ) : (
              <button
                key={label}
                type="button"
                onClick={onClose}
                className={`${NAV_ITEM_BASE_CLASSES} ${NAV_ITEM_INACTIVE_CLASSES}`}
              >
                <Icon className="size-5 shrink-0" />
                {label}
              </button>
            ),
          )}
        </nav>

        <div className="border-t border-gray-200 p-4 dark:border-gray-800">
          <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5 dark:bg-gray-800/60">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
              RH
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                Rezaul Hoque
              </p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                Admin
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
