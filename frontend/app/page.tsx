'use client';

import { useState } from 'react';
import Layout from './components/layout/Layout';
import DashboardOverview from './components/dashboard/DashboardOverview';
import AlertBanner from './components/common/AlertBanner';

export default function Home() {
  const [showAlert, setShowAlert] = useState(false);

  // Simulate a random alert after page loads
  setTimeout(() => {
    if (Math.random() < 0.3) { // 30% chance to show an alert
      setShowAlert(true);
    }
  }, 5000);

  return (
    <>
      {showAlert && (
        <AlertBanner 
          show={showAlert} 
          onClose={() => setShowAlert(false)}
        />
      )}
      <Layout>
        <DashboardOverview />
      </Layout>
    </>
  );
}
