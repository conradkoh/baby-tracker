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
import { useCallback, useMemo, useRef } from 'react';
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
export default function CreateFeedPage() {
  const [feedType, setFeedType] = useState<string>('expressed');
  const [date, setDate] = useState(new Date());
  const [vol, setVol] = useState(50);
  const volInputRef = useRef<TextInput>(null);
  const createActivity = useMutation(api.activities.create);
  const onCreateFeedPress = useCallback(() => {
    const formData = {
      type: feedType,
      timestamp: date.getTime(),
      vol,
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
            ml: formData.vol,
          },
        },
      },
    });
  }, [createActivity, date, feedType, vol]);
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
                value={'' + vol}
                onChangeText={(v) => {
                  const newVol = parseFloat(v);
                  if (isFinite(newVol)) {
                    setVol(newVol);
                  }
                }}
                onFocus={() => {
                  volInputRef.current?.setSelection(0, ('' + vol).length);
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
  const bottomEl = useRef(<PrimaryButton onPress={onPress} title="Save" />);
  useEffect(() => {
    page.setBottomEl(bottomEl.current);
    return () => page.reset();
  }, [onPress, page]);
  return <></>;
}
