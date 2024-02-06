import React from 'react';
import SelectPicker from '../SelectPicker';

const FeedPicker = (props: {
  value: string;
  onChange: (v: string) => void;
}) => {
  return (
    <SelectPicker
      options={[
        { value: 'expressed', label: 'Expressed' },
        { value: 'latch', label: 'Latch' },
        { value: 'formula', label: 'Formula' },
      ]}
      value={props.value}
      onChange={props.onChange}
    />
  );
};

export default FeedPicker;
