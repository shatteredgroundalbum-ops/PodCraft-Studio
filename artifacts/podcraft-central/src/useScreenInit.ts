import { useLocation } from 'react-router-dom';

export function useScreenInit(): Record<string, string> | null {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return Object.keys(result).length > 0 ? result : null;
}
