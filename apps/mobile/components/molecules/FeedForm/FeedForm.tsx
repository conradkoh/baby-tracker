import {
  Button,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  View,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
} from 'react-native';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { useEffect, useState } from 'react';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import { DateTime } from 'luxon';
import React from 'react';
import { FeedType } from '../../../../../core/domain/entities/Feed';
import { useFeedFormStore } from '../../../storage/stores/feed-form-store';
import PrimaryButton from '../../atoms/Button/Primary';
import FeedPicker from '../../atoms/FeedPicker';
import { usePage } from '../../organisms/Page';
import { Loader } from '../Loader';
import { Conditional } from '../../atoms/Condition';
interface FeedFormProps {
  onSubmit: (p: FeedFormData) => Promise<void>;
  mode: 'create' | 'edit';
}
export interface FeedFormRef {
  load: (formData: FeedFormData) => void;
}

type FeedFormData =
  | {
      type: FeedType.Expressed | FeedType.Formula;
      timestamp: DateTime;
      volume: number;
    }
  | {
      type: FeedType.Latch;
      timestamp: DateTime;
      duration: number;
    };

export const FeedForm = forwardRef<FeedFormRef, FeedFormProps>(
  ({ mode, onSubmit: createFeed }: FeedFormProps, ref) => {
    const [date, setDate] = useState(new Date());
    const volInputRef = useRef<TextInput>(null);
    const { feedType, setFeedType, volume, setVolume } = useFeedFormStore();
    const [duration, setDuration] = useState(0);
    const durationInputRef = useRef<TextInput>(null);
    const [isReady, setReady] = useState(false);
    const onCreateFeedPress = useCallback(() => {
      switch (feedType) {
        case FeedType.Expressed:
        case FeedType.Formula: {
          createFeed({
            type: feedType,
            timestamp: DateTime.fromJSDate(date),
            volume: volume,
          });
          break;
        }
        case FeedType.Latch: {
          createFeed({
            type: feedType,
            timestamp: DateTime.fromJSDate(date),
            duration,
          });
          break;
        }
      }
    }, [createFeed, date, duration, feedType, volume]);
    useImperativeHandle(ref, () => ({
      load(formData: FeedFormData) {
        switch (formData.type) {
          case FeedType.Expressed:
          case FeedType.Formula: {
            setVolume(formData.volume);
            break;
          }
          case FeedType.Latch: {
            setDuration(formData.duration);
            break;
          }
        }
        setDate(formData.timestamp.toJSDate());
        setFeedType(formData.type);

        //mark as ready
        setReady(true);
      },
    }));
    const handleDateChange = useCallback(
      (event: DateTimePickerEvent, date?: Date) => {
        if (date) {
          setDate(date);
        }
      },
      []
    );
    //check loading
    useEffect(() => {
      if (mode === 'create') setReady(true);
    }, [mode]);

    return (
      <SafeAreaView className="h-full flex flex-1 flex-col items-center">
        <Loader loading={!isReady}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <>
              <View
                className="mt-2 w-1/2 rounded-lg"
                style={{ backgroundColor: 'rgba(184, 207, 237, 255)' }}
              >
                <FeedPicker value={feedType} onChange={setFeedType} />
              </View>
              <View
                className="mt-2 flex flex-row justify-center"
                style={{ transform: [{ scale: 0.8 }] }}
              >
                <DateTimePicker
                  value={date}
                  mode="datetime"
                  onChange={handleDateChange}
                />
              </View>
              <Conditional render={feedType != FeedType.Latch}>
                <TouchableOpacity
                  className="mt-2 p-2 w-1/2 flex-row justify-center rounded-lg"
                  style={{ backgroundColor: 'rgba(184, 207, 237, 255)' }}
                  onPress={() => volInputRef.current?.focus()}
                >
                  <TextInput
                    ref={volInputRef}
                    style={{ backgroundColor: 'rgba(184, 207, 237, 255)' }}
                    placeholder="Volume (ml)"
                    value={'' + volume}
                    onChangeText={(v) => {
                      const newVol = parseFloat(v);
                      if (isFinite(newVol)) {
                        setVolume(newVol);
                      }
                    }}
                    onFocus={() => {
                      volInputRef.current?.setSelection(
                        0,
                        ('' + volume).length
                      );
                    }}
                    selectTextOnFocus={true}
                  />
                  <Text> ml</Text>
                </TouchableOpacity>
              </Conditional>
              <Conditional render={feedType == FeedType.Latch}>
                <TouchableOpacity
                  className="mt-2 p-2 w-1/2 flex-row justify-center rounded-lg"
                  style={{ backgroundColor: 'rgba(184, 207, 237, 255)' }}
                  onPress={() => durationInputRef.current?.focus()}
                >
                  <TextInput
                    ref={durationInputRef}
                    style={{ backgroundColor: 'rgba(184, 207, 237, 255)' }}
                    placeholder="Duration (mins)"
                    value={'' + duration}
                    onChangeText={(v) => {
                      const duration = parseFloat(v);
                      if (isFinite(duration)) {
                        setDuration(duration);
                      }
                    }}
                    onFocus={() => {
                      durationInputRef.current?.setSelection(
                        0,
                        ('' + duration).length
                      );
                    }}
                    selectTextOnFocus={true}
                  />
                  <Text> mins</Text>
                </TouchableOpacity>
              </Conditional>
            </>
          </TouchableWithoutFeedback>

          <CreateFeedButton onPress={onCreateFeedPress} />
        </Loader>
      </SafeAreaView>
    );
  }
);

/**
 * Attaches the create feed button to the page
 * @returns
 */
function CreateFeedButton({ onPress }: { onPress: () => void }) {
  const page = usePage();
  useEffect(() => {
    page.setBottomEl(<PrimaryButton onPress={onPress} title="Save" />);
    return () => page.reset();
  }, [onPress, page]);
  return <></>;
}
