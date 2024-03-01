import React from 'react';
import BaseButton, { BaseButtonProps } from './Base';

export default function PrimaryButton(props: Omit<BaseButtonProps, 'variant'>) {
  return <BaseButton {...props} className="bg-blue-800" />;
}
