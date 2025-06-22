'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiGrid, FiSettings, FiUploadCloud, FiFileText, FiSmile } from 'react-icons/fi';
import styles from './Sidebar.module.css';

const Sidebar = () => {
  const pathname = usePathname();

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: FiGrid },
    { href: '/settings', label: 'Settings', icon: FiSettings },
    { href: '/publish', label: 'Publish', icon: FiUploadCloud },
    { href: '/humor-experimentation', label: 'Humor Experimentation', icon: FiSmile },
  ];

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        <ul className={styles.navList}>
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
            const linkClassName = `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`;

            return (
              <li key={link.href} className={styles.navItem}>
                <Link href={link.href} className={linkClassName}>
                  <span className={styles.iconWrapper}><Icon /></span>
                  <span>{link.label}</span>
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