/**
 * Layout Component
 * Main application layout with sidebar navigation
 */

import { Outlet, NavLink } from 'react-router-dom';
import { useProfiles } from '../../hooks';
import styles from './Layout.module.css';

// Icons (inline SVG for simplicity)
const icons = {
    dashboard: (
        <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
            <path d="M6.5 1.75a.75.75 0 00-1.5 0V5H1.75a.75.75 0 000 1.5H5v3.5H1.75a.75.75 0 000 1.5H5v2.75a.75.75 0 001.5 0V11.5h3v2.75a.75.75 0 001.5 0V11.5h3.25a.75.75 0 000-1.5H11v-3.5h3.25a.75.75 0 000-1.5H11V1.75a.75.75 0 00-1.5 0V5h-3V1.75zM9.5 6.5v3h-3v-3h3z" />
        </svg>
    ),
    profiles: (
        <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
            <path d="M10.561 8.073a6.005 6.005 0 013.432 5.142.75.75 0 11-1.498.07 4.5 4.5 0 00-8.99 0 .75.75 0 11-1.498-.07 6.004 6.004 0 013.431-5.142 3.999 3.999 0 115.123 0zM10.5 5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
    ),
    repos: (
        <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z" />
        </svg>
    ),
    settings: (
        <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0a8.2 8.2 0 01.701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.1-.303c.634-.176 1.298.021 1.645.545.108.163.215.332.318.505l.094.163c.255.455.264.997.024 1.455l-.54.992c-.035.063-.05.163-.013.295.082.292.139.59.17.89.018.17.106.28.204.331l1.013.507c.577.29.94.884.94 1.507a8.001 8.001 0 01-1.042 3.16c-.282.52-.843.85-1.453.85h-1.187c-.072 0-.172.033-.263.107a5.77 5.77 0 01-.726.49c-.115.068-.178.171-.192.283l-.099 1.188c-.054.654-.539 1.184-1.187 1.303a8.13 8.13 0 01-2.764 0c-.648-.12-1.133-.65-1.187-1.303l-.099-1.188c-.014-.112-.077-.215-.192-.283a5.77 5.77 0 01-.726-.49c-.091-.074-.191-.107-.263-.107H3.053c-.61 0-1.171-.33-1.453-.85A8.001 8.001 0 01.558 7.969c0-.623.363-1.217.94-1.507l1.013-.507c.098-.05.186-.16.204-.331.031-.3.088-.598.17-.89.037-.132.022-.232-.013-.295l-.54-.992c-.24-.458-.231-1-.024-1.455L2.4 2c.103-.173.21-.342.318-.505.347-.524 1.011-.72 1.645-.545l1.1.303c.066.019.176.011.299-.071.214-.143.437-.272.668-.386.133-.066.194-.158.212-.224l.289-1.107C6.01.645 6.556.095 7.299.03 7.527.01 7.76 0 8 0zM8 4.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM6.5 8a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" />
        </svg>
    ),
};

export default function Layout() {
    const { defaultProfile } = useProfiles();

    return (
        <div className={styles.layout}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.logo}>
                    <svg width="28" height="28" viewBox="0 0 16 16" fill="currentColor" className={styles.logoIcon}>
                        <path d="M8.186 1.113a.5.5 0 00-.372 0L1.846 3.5 8 5.961 14.154 3.5 8.186 1.113zM15 4.239l-6.5 2.6v7.922l6.5-2.6V4.24zM7.5 14.762V6.838L1 4.239v7.923l6.5 2.6zM7.443.184a1.5 1.5 0 011.114 0l7.129 2.852A.5.5 0 0116 3.5v8.662a1 1 0 01-.629.928l-7.185 2.874a.5.5 0 01-.372 0L.63 13.09a1 1 0 01-.629-.928V3.5a.5.5 0 01.314-.464L7.443.184z" />
                    </svg>
                    <span className={styles.logoText}>GitSwitch</span>
                </div>

                <nav className={styles.nav}>
                    <NavLink
                        to="/"
                        end
                        className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
                    >
                        {icons.dashboard}
                        <span>Dashboard</span>
                    </NavLink>

                    <NavLink
                        to="/profiles"
                        className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
                    >
                        {icons.profiles}
                        <span>Profiles</span>
                    </NavLink>

                    <NavLink
                        to="/repositories"
                        className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
                    >
                        {icons.repos}
                        <span>Repositories</span>
                    </NavLink>

                    <NavLink
                        to="/settings"
                        className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
                    >
                        {icons.settings}
                        <span>Settings</span>
                    </NavLink>
                </nav>

                {/* Current Profile Indicator */}
                {defaultProfile && (
                    <div className={styles.currentProfile}>
                        <div
                            className={styles.profileDot}
                            style={{ backgroundColor: defaultProfile.color }}
                        />
                        <div className={styles.profileInfo}>
                            <span className={styles.profileLabel}>{defaultProfile.label}</span>
                            <span className={styles.profileEmail}>{defaultProfile.email}</span>
                        </div>
                    </div>
                )}
            </aside>

            {/* Main Content */}
            <main className={styles.main}>
                <Outlet />
            </main>
        </div>
    );
}
