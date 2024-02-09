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
import { FeedForm } from '../../components/molecules/FeedForm';
export default function CreateFeedPage() {
  const createActivity = useMutation(api.activities.create);

  return (
    <Page title="Create Feed">
      <FeedForm
        onSubmit={async function (formData): Promise<void> {
          const ts = formData.timestamp.toISO();
          if (ts === null)
            throw new Error('invalid timestamp: ' + formData.timestamp);
          await createActivity({
            activity: {
              timestamp: ts,
              type: 'feed',
              feed: {
                type: formData.type,
                volume: {
                  ml: formData.volume,
                },
              },
            },
          });
        }}
      />
    </Page>
  );
}
