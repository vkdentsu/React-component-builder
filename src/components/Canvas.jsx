import RowsCanvas from './RowsCanvas';
import useBuilderStore from '../store/builderStore';

const DEVICE_WIDTHS = {
  mobile:  '375px',
  tablet:  '768px',
  desktop: '100%',
};

export default function Canvas() {
  const { rows, device, deselect } = useBuilderStore();

  return (
    <div className="flex-1 min-h-0 overflow-auto bg-[#f1f5f9] flex justify-center p-6">
      <div
        style={{ width: DEVICE_WIDTHS[device], transition: 'width 0.3s ease' }}
        /* Remove overflow-hidden here — let the inner content grow naturally */
        className="bg-white rounded-2xl shadow-sm border border-gray-200 min-h-[520px] flex flex-col self-start"
      >
        {/* Browser chrome dots */}
        <div className="flex items-center justify-center py-2 border-b border-gray-100 gap-1.5 shrink-0">
          <div className="w-2 h-2 rounded-full bg-gray-200" />
          <div className="w-16 h-1.5 rounded-full bg-gray-200" />
          <div className="w-2 h-2 rounded-full bg-gray-200" />
        </div>

        <div onClick={deselect} className="flex-1 flex flex-col">
          <RowsCanvas rows={rows} hops={[]} device={device} nested={false} />
        </div>
      </div>
    </div>
  );
}
