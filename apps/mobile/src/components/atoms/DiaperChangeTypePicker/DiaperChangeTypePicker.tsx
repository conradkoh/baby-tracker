import { DiaperChangeType } from '@workspace/domain/entities/DiaperChange';
import SelectPicker from '../SelectPicker';

const DiaperChangeTypePicker = (props: {
  value: string;
  onChange: (v: DiaperChangeType) => void;
}) => {
  return (
    <SelectPicker
      options={[
        { value: DiaperChangeType.Dirty, label: 'Dirty' },
        { value: DiaperChangeType.Wet, label: 'Wet' },
        { value: DiaperChangeType.Mixed, label: 'Mixed' },
      ]}
      value={props.value}
      onChange={(v) => props.onChange(v as DiaperChangeType)}
    />
  );
};

export default DiaperChangeTypePicker;
