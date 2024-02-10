import { ScrollView, Text, View } from 'react-native';
import AppNav from './AppNav';
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function Page(props: { title: string; children: any }) {
  const bottomElWrapperRef = useRef<BottomElWrapper>(null);
  return (
    <pageContext.Provider
      value={{
        setBottomEl: useCallback((el) => {
          bottomElWrapperRef.current?.setEl(el);
        }, []),
        reset: useCallback(() => {
          bottomElWrapperRef.current?.reset();
        }, []),
      }}
    >
      <View className="flex-1 bg-blue-200 min-h-screen">
        <SafeAreaView className="grow">
          <View className="px-2 h-30">
            <Text className="text-3xl font-bold">{props.title}</Text>
            <View className="my-2">
              <AppNav />
            </View>
          </View>
          <View className="grow">
            <ScrollView alwaysBounceVertical={false}>
              {props.children}
            </ScrollView>
          </View>
          <BottomElWrapper ref={bottomElWrapperRef} />
        </SafeAreaView>
      </View>
    </pageContext.Provider>
  );
}

class BottomElWrapper extends React.Component {
  _bottomEl: React.ReactNode | null = null;
  constructor(props: any) {
    super(props);
  }
  setEl(el: React.ReactNode | null) {
    this._bottomEl = el;
    this.setState({}); //re-render
  }
  reset() {
    this._bottomEl = null;
    this.setState({});
  }
  render() {
    if (!this._bottomEl) {
      return <></>;
    }
    return <View className="h-18 py-4">{this._bottomEl}</View>;
  }
}

interface PageContextState {
  setBottomEl: (bottomEl: React.ReactNode) => void;
  reset: () => void;
}

const pageContext = createContext<PageContextState>({
  setBottomEl: () => {
    throw new Error('must init page context before calling setBottomEl');
  },
  reset: () => {
    throw new Error('must init page context before calling reset');
  },
});

export function usePage() {
  const ctx = useContext(pageContext);
  return ctx;
}
