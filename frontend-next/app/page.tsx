'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../context/UserContext';
import styles from './page.module.css';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }
  
  if (user) {
    return null; // Don't render anything while redirecting
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <Image
        src="/assets/images/landingPageBackground.png"
        alt="Landing Page Background"
        layout="fill"
        objectFit="cover"
        quality={100}
      />
      <div
        style={{
          position: 'absolute',
          top: '5%',
          left: '5%',
          color: 'white',
          textAlign: 'left',
        }}
      >
        <h1 className={styles.title}>parodypipeline.com</h1>
        <p className={styles.description}>
          AI-powered tools to help you create, refine, and publish your parody video scripts.
        </p>
        <div style={{ marginTop: '20px' }}>
          <Link href="/login" passHref>
            <button className={styles.button}>Login</button>
          </Link>
          <Link href="/signup" passHref>
            <button className={styles.button} style={{ marginLeft: '10px' }}>Sign Up</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
