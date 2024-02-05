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
import { useCallback, useRef } from 'react';
import Page, { usePage } from '../../components/organisms/Page';
import PrimaryButton from '../../components/atoms/Button/Primary';
import { useEffect, useState } from 'react';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import FeedPicker from '../../components/atoms/FeedPicker';
import { useMutation } from 'convex/react';
import { api } from '../../services/api';
import { DateTime } from 'luxon';
import { useFeedFormStore } from '../storage/stores/feed-form-store';
export default function CreateFeedPage() {
  const [date, setDate] = useState(new Date());
  const volInputRef = useRef<TextInput>(null);
  const createActivity = useMutation(api.activities.create);
  const { feedType, setFeedType, volume, setVolume } = useFeedFormStore();
  const onCreateFeedPress = useCallback(() => {
    const formData = {
      type: feedType,
      timestamp: date.getTime(),
      volume,
    };
    const ts = DateTime.fromJSDate(date).toUTC().toISO();
    if (ts == null) {
      throw new Error('invalid activity timestamp: ' + date.toString());
    }
    createActivity({
      activity: {
        timestamp: ts,
        type: 'feed',
        feed: {
          type: feedType,
          volume: {
            ml: formData.volume,
          },
        },
      },
    });
  }, [createActivity, date, feedType, volume]);
  return (
    <Page title="Create Feed">
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
    </Page>
  );
}
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
