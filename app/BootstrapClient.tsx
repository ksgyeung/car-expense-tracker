'use client';

import { useEffect } from 'react';

/**
 * BootstrapClient Component
 * 
 * Loads Bootstrap JavaScript on the client side for interactive components.
 * This is necessary for components like navbar collapse, modals, etc.
 */
export default function BootstrapClient() {
  useEffect(() => {
    // Dynamically import Bootstrap JS only on client side
    // @ts-ignore - Bootstrap doesn't have TypeScript definitions for the bundle
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  return null;
}
