import { Text, View } from 'react-native';
import AppNav from './AppNav';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react';
import React from 'react';
import { SafeAreaView } from 'react-native';
export interface PageProps {
  title: string;
  children: React.ReactNode;
}
export default function Page(props: PageProps) {
  const bottomElWrapperRef = useRef<BottomElWrapper>(null);
  return (
    <pageContext.Provider
      value={{
        setBottomEl: useCallback((el) => {
          bottomElWrapperRef.current?.setEl(el);
        }, []),
        unsetBottomEl: useCallback(() => {
          bottomElWrapperRef.current?.unsetEl();
        }, []),
        reset: useCallback(() => {
          bottomElWrapperRef.current?.reset();
        }, []),
      }}
    >
      <View className="grow">
        <SafeAreaView className="grow">
          <View className="px-2 h-30">
            <Text className="text-3xl font-bold">{props.title}</Text>
            <View className="my-2">
              <AppNav />
            </View>
          </View>
          <View className="grow">{props.children}</View>
          <BottomElWrapper ref={bottomElWrapperRef} />
        </SafeAreaView>
      </View>
    </pageContext.Provider>
  );
}

export function withPage(
  props: Omit<PageProps, 'children'>,
  Component: React.FC
) {
  return function PageWrapper() {
    console.log('re-rendering page');
    return (
      <Page {...props}>
        <Component />
      </Page>
    );
  };
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
  unsetEl() {
    this._bottomEl = null;
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
  unsetBottomEl: () => void;
  reset: () => void;
}

const pageContext = createContext<PageContextState>({
  setBottomEl: () => {
    throw new Error('must init page context before calling setBottomEl');
  },
  unsetBottomEl: () => {
    throw new Error('must init page context before calling unsetBottomEl');
  },
  reset: () => {
    throw new Error('must init page context before calling reset');
  },
});

export function usePage() {
  const ctx = useContext(pageContext);
  return ctx;
}
