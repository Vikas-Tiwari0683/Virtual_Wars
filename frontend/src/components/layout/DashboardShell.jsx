// =============================================================================
// SECTION: DashboardShell — Shared Layout Wrapper
// Every inner page (Log, Insights, Goals, Community, Learn) uses this shell.
// Includes:
//   - Skip-to-main-content link for keyboard / screen reader users
//   - Sidebar + MobileBottomNav
//   - Consistent main content padding
// =============================================================================

import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';
import PropTypes from 'prop-types';

export default function DashboardShell({ children }) {
  return (
    <div className="bg-[#f9f9ff] min-h-screen">
      {/* Skip link — visually hidden until focused by keyboard */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] bg-[#006b2c] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg"
      >
        Skip to main content
      </a>

      <Sidebar />
      <MobileBottomNav />
      <main
        className="md:ml-64 p-4 md:p-8 pb-24 md:pb-8 min-h-screen"
        id="main-content"
        tabIndex={-1}
      >
        {children}
      </main>
    </div>
  );
}

DashboardShell.propTypes = {
  children: PropTypes.node,
};
