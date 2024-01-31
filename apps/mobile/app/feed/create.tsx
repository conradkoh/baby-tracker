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
import { useRef } from 'react';
import Page, { usePage } from '../../components/organisms/Page';
import PrimaryButton from '../../components/atoms/Button/Primary';
import { useEffect, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';

import FeedPicker from '../../components/atoms/FeedPicker';
import { useMutation } from 'convex/react';
import { api } from '../../services/api';
export default function CreateFeedPage() {
  const [feedType, setFeedType] = useState<string>('expressed');
  const [date, setDate] = useState(new Date());
  const [vol, setVol] = useState(50);
  const volInputRef = useRef<TextInput>();
  const createActivity = useMutation(api.activities.create);
  // const ml;
  return (
    <Page title="Create Feed">
      <SafeAreaView className="flex-col items-center">
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
              <DateTimePicker value={date} mode="datetime" />
            </View>
            <TouchableOpacity
              className="mt-2 p-2 w-1/2 flex-row justify-center rounded-lg"
              style={{ backgroundColor: 'rgba(184, 207, 237, 255)' }}
              onPress={() => volInputRef.current.focus()}
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
                    console.log({ newVol });
                  }
                }}
                onFocus={() => {
                  volInputRef.current.setSelection(0, ('' + vol).length);
                }}
                selectTextOnFocus={true}
              />
              <Text> ml</Text>
            </TouchableOpacity>
          </>
        </TouchableWithoutFeedback>
      </SafeAreaView>
      <CreateFeedButton
        onPress={() => {
          const formData = {
            type: feedType,
            timestamp: date.getTime(),
            vol,
          };
          console.log({ formData, vol });
          createActivity({
            activity: {
              timestamp: formData.timestamp,
              type: 'feed',
              feed: {
                type: feedType,
                volume: {
                  ml: formData.vol,
                },
              },
            },
          });
        }}
      />
    </Page>
  );
}
/**
 * Attaches the create feed button to the page
 * @returns
 */
function CreateFeedButton({ onPress }) {
  const page = usePage();
  useEffect(() => {
    page.setBottomEl(<PrimaryButton onPress={onPress} title="Save" />);
    return () => page.reset();
  }, [onPress, page]);
  return <></>;
}
