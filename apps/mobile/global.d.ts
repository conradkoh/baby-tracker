/// <reference types="nativewind/types" />

// RN 0.76 ships its own types internally; nativewind v2 augmentations
// target @types/react-native module structure which no longer applies.
// Patch className/tw into RN component types via explicit overrides.

import 'react-native';

declare module 'react-native' {
  // Override View component signature to accept className
  interface ViewProps {
    className?: string;
    tw?: string;
  }
  interface TextProps {
    className?: string;
    tw?: string;
  }
  interface TextInputProps {
    className?: string;
    tw?: string;
  }
  interface TouchableOpacityProps {
    className?: string;
    tw?: string;
  }
  interface PressableProps {
    className?: string;
    tw?: string;
  }
  interface ImageProps {
    className?: string;
    tw?: string;
  }
  interface SwitchProps {
    className?: string;
    tw?: string;
  }
  interface ScrollViewProps {
    className?: string;
    tw?: string;
  }
  interface FlatListProps<ItemT> {
    className?: string;
    tw?: string;
  }
  interface SectionListProps<ItemT> {
    className?: string;
    tw?: string;
  }
}


