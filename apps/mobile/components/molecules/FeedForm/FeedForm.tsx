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
import { FeedType } from '../../../domain/entities/Feed';
import { useFeedFormStore } from '../../../storage/stores/feed-form-store';
import PrimaryButton from '../../atoms/Button/Primary';
import FeedPicker from '../../atoms/FeedPicker';
import Page, { usePage } from '../../organisms/Page';
interface FeedFormProps {
  onSubmit: (p: FeedFormData) => Promise<void>;
}
interface FeedFormData {
  type: FeedType;
  timestamp: DateTime;
  volume: number;
}

export const FeedForm = forwardRef(
  ({ onSubmit: createFeed }: FeedFormProps, ref) => {
    const [date, setDate] = useState(new Date());

    const volInputRef = useRef<TextInput>(null);
    const { feedType, setFeedType, volume, setVolume } = useFeedFormStore();
    const onCreateFeedPress = useCallback(() => {
      createFeed({
        type: feedType,
        timestamp: DateTime.fromJSDate(date),
        volume: volume,
      });
    }, [createFeed, date, feedType, volume]);
    useImperativeHandle(ref, () => ({
      load(formData: FeedFormData) {
        setDate(formData.timestamp.toJSDate());
        setFeedType(formData.type);
        setVolume(formData.volume);
      },
    }));
    return (
      <SafeAreaView className="h-full flex flex-1 flex-col items-center">
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
                onChange={useCallback(
                  (event: DateTimePickerEvent, date?: Date) => {
                    if (date) {
                      setDate(date);
                    }
                  },
                  []
                )}
              />
            </View>
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
                  volInputRef.current?.setSelection(0, ('' + volume).length);
                }}
                selectTextOnFocus={true}
              />
              <Text> ml</Text>
            </TouchableOpacity>
          </>
        </TouchableWithoutFeedback>

        <CreateFeedButton onPress={onCreateFeedPress} />
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
