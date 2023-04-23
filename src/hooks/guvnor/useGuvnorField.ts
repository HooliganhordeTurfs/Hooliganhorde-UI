import { useSelector } from 'react-redux';
import { AppState } from '~/state';

const useGuvnorField = () => useSelector<AppState, AppState['_guvnor']['field']>((state) => state._farmer.field);

export default useGuvnorField;
