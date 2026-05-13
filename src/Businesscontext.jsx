import { createContext, useContext, useState, useEffect } from 'react';
import { getBusinesses } from './api';
import { useAuth } from './Authcontext';

const BusinessContext = createContext(null);

export function BusinessProvider({ children }) {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [activeBusiness, setActiveBusiness] = useState(null);

  useEffect(() => {
    if (user) {
      getBusinesses().then((res) => {
        setBusinesses(res.data);
        const saved = localStorage.getItem('active_business');
        if (saved) {
          const found = res.data.find((b) => b.id === parseInt(saved));
          setActiveBusiness(found || res.data[0] || null);
        } else {
          setActiveBusiness(res.data[0] || null);
        }
      });
    }
  }, [user]);

  const switchBusiness = (business) => {
    setActiveBusiness(business);
    localStorage.setItem('active_business', business.id);
  };

  const refreshBusinesses = () => {
    getBusinesses().then((res) => setBusinesses(res.data));
  };

  return (
    <BusinessContext.Provider value={{ businesses, activeBusiness, switchBusiness, refreshBusinesses }}>
      {children}
    </BusinessContext.Provider>
  );
}

export const useBusiness = () => useContext(BusinessContext);