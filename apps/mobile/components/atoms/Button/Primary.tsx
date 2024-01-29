import React from 'react';
import { Variant } from '../../../app/styles/variants';
import BaseButton, { BaseButtonProps } from './Base';

export default function PrimaryButton(props: Omit<BaseButtonProps, 'variant'>) {
  return <BaseButton {...props} variant={Variant.Primary} />;
}
