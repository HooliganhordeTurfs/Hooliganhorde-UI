import { useSelector } from 'react-redux';
import { AppState } from '~/state';

export default function useSeason() {
  return useSelector<AppState, AppState['_hooliganhorde']['sun']['season']>((state) => state._hooliganhorde.sun.season);
}
