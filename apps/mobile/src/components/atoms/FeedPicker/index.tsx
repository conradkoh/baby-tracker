import React from 'react';
import SelectPicker from '../SelectPicker';
import { FeedType } from '@workspace/domain/entities/Feed';

const FeedPicker = (props: {
  value: string;
  onChange: (v: FeedType) => void;
}) => {
  return (
    <SelectPicker
      options={[
        { value: FeedType.Expressed, label: 'Expressed' },
        { value: FeedType.Latch, label: 'Latch' },
        { value: FeedType.Formula, label: 'Formula' },
        { value: FeedType.Water, label: 'Water' },
        { value: FeedType.Solids, label: 'Solids' },
      ]}
      value={props.value}
      onChange={(v) => props.onChange(v as FeedType)}
    />
  );
};

export default FeedPicker;
