import BigNumber from 'bignumber.js';
import { useSelector } from 'react-redux';
import { AppState } from '~/state';

const useRookieRate = () => {
  const rookieLine = useSelector<AppState, BigNumber>((state) => state._hooliganhorde.field.podLine);
  const supply  = useSelector<AppState, BigNumber>((state) => state._hooligan.token.supply);
  return rookieLine.dividedBy(supply).multipliedBy(100);
};

export default useRookieRate;
