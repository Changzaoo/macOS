import { useState, useEffect } from 'react';
import { checkFirstUserExists } from '../services/authService';

export const useFirstUserCheck = () => {
  const [firstUserExists, setFirstUserExists] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkFirstUserExists()
      .then(setFirstUserExists)
      .catch(() => setFirstUserExists(true))
      .finally(() => setLoading(false));
  }, []);

  return { firstUserExists, loading };
};
