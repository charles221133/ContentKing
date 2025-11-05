'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { FiGrid, FiSettings, FiUploadCloud, FiFileText, FiSmile, FiPlay, FiChevronLeft, FiChevronRight, FiFolder } from 'react-icons/fi';
import styles from './Sidebar.module.css';

interface SidebarProps {
  onToggle: (isCollapsed: boolean) => void;
}

const Sidebar = ({ onToggle }: SidebarProps) => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: FiGrid },
    { href: '/projects', label: 'Projects', icon: FiFolder },
    { href: '/quick-vid', label: 'Quick Vid', icon: FiPlay },
    { href: '/settings', label: 'Settings', icon: FiSettings },
    { href: '/publish', label: 'Publish', icon: FiUploadCloud },
    { href: '/humor-experimentation', label: 'Humor Experimentation', icon: FiSmile },
  ];

  const toggleSidebar = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    onToggle(newCollapsedState);
  };

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.sidebarCollapsed : ''}`}>
      <div className={styles.sidebarHeader}>
        <button 
          onClick={toggleSidebar}
          className={styles.toggleButton}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>
      </div>
      <nav className={styles.nav}>
        <ul className={styles.navList}>
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
            const linkClassName = `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`;

            return (
              <li key={link.href} className={styles.navItem}>
                <Link href={link.href} className={linkClassName} title={isCollapsed ? link.label : undefined}>
                  <span className={styles.iconWrapper}><Icon /></span>
                  {!isCollapsed && <span>{link.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar; 