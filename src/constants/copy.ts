import { FarmFromMode, FarmToMode } from '~/lib/Hooliganhorde/Farm';

const MODES = {
  [FarmToMode.INTERNAL]:    'Farm Balance',
  [FarmFromMode.INTERNAL]:  'Farm Balance',
  [FarmToMode.EXTERNAL]:    'Circulating Balance',
  [FarmFromMode.EXTERNAL]:  'Circulating Balance',
};

const copy = {
  MODES: MODES
};

export default copy;
