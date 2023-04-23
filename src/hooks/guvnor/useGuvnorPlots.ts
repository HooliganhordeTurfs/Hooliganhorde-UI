import { useSelector } from 'react-redux';
import { AppState } from '~/state';

const useGuvnorPlots = () => useSelector<AppState, AppState['_guvnor']['field']['plots']>((state) => state._farmer.field.plots);

export default useGuvnorPlots;
