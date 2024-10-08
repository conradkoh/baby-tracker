import { Text, View, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { useEffect, useState } from 'react';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import { DateTime } from 'luxon';
import React from 'react';
import { FeedType } from '@workspace/domain/entities/Feed';
import { useFeedFormStore } from '../../../storage/stores/feed-form-store';
import PrimaryButton from '../../atoms/Button/Primary';
import FeedPicker from '../../atoms/FeedPicker';
import { usePage } from '../../organisms/Page';
import { Loader } from '../Loader';
import { Conditional } from '../../atoms/Condition';
import { BreastTimer } from '../BreastTimer/BreastTimer';
import DurationPicker from '../../atoms/DurationPicker/DurationPicker';
import { FormulaCalculator } from '../FormulaCalculator';
import { TextInput } from '../../atoms/TextInput/TextInput';
interface FeedFormProps {
  onSubmit: (p: FeedFormData) => Promise<void>;
  mode: 'create' | 'edit';
}
export interface FeedFormRef {
  load: (formData: FeedFormData) => void;
}

type FeedFormData =
  | {
      type: FeedType.Expressed | FeedType.Formula | FeedType.Water;
      timestamp: DateTime;
      volume: number;
    }
  | {
      type: FeedType.Latch;
      timestamp: DateTime;
      duration: {
        left: {
          seconds: number;
        };
        right: {
          seconds: number;
        };
      };
    }
  | {
      type: FeedType.Solids;
      timestamp: DateTime;
      description: string;
    };

export const FeedForm = forwardRef<FeedFormRef, FeedFormProps>(
  ({ mode, onSubmit }: FeedFormProps, ref) => {
    const [date, setDate] = useState(new Date());
    const { feedType, setFeedType, volume, setVolume } = useFeedFormStore();
    const [duration, setDuration] = useState({
      left: { seconds: 0 },
      right: { seconds: 0 },
    });
    const [description, setDescription] = useState('');
    const [isReady, setReady] = useState(false);
    const [disableSubmit, setDisableSubmit] = useState(false);
    const onCreateFeedPress = useCallback(() => {
      setDisableSubmit(true);
      try {
        switch (feedType) {
          case FeedType.Water:
          case FeedType.Expressed:
          case FeedType.Formula: {
            onSubmit({
              type: feedType,
              timestamp: DateTime.fromJSDate(date),
              volume: volume,
            });
            break;
          }
          case FeedType.Latch: {
            onSubmit({
              type: feedType,
              timestamp: DateTime.fromJSDate(date),
              duration,
            });
            break;
          }
          case FeedType.Solids: {
            onSubmit({
              type: feedType,
              timestamp: DateTime.fromJSDate(date),
              description,
            });
            break;
          }
          default: {
            // exhaustive
            const _: never = feedType;
            throw new Error(`invalid feed type: ${_}`);
          }
        }
      } catch (err) {
        setDisableSubmit(false);
        throw err;
      }
      setDisableSubmit(false);
    }, [onSubmit, date, duration, feedType, volume, description]);
    useImperativeHandle(ref, () => ({
      load(formData: FeedFormData) {
        switch (formData.type) {
          case FeedType.Water:
          case FeedType.Expressed:
          case FeedType.Formula: {
            setVolume(formData.volume);
            break;
          }
          case FeedType.Latch: {
            setDuration(formData.duration);
            break;
          }
          case FeedType.Solids: {
            setDescription(formData.description);
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
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="h-full w-full flex-1 flex-col items-center">
          <Loader loading={!isReady}>
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
              <Conditional
                render={
                  feedType !== FeedType.Latch && feedType !== FeedType.Solids
                }
              >
                <View
                  className="mt-2 p-2 w-1/2 flex-row justify-center rounded-lg"
                  style={{ backgroundColor: 'rgba(184, 207, 237, 255)' }}
                >
                  <TextInput
                    className="flex-grow text-center"
                    keyboardType="number-pad"
                    placeholder="Volume (ml)"
                    value={'' + volume}
                    onChangeText={(v) => {
                      const newVol = parseFloat(v);
                      if (isFinite(newVol)) {
                        setVolume(newVol);
                      } else {
                        setVolume(0);
                      }
                    }}
                    selectTextOnFocus={true}
                  >
                    <Text> ml</Text>
                  </TextInput>
                </View>
              </Conditional>
              <Conditional render={feedType === FeedType.Solids}>
                <View
                  className="mt-2 p-2 w-1/2 flex-row justify-center rounded-lg"
                  style={{ backgroundColor: 'rgba(184, 207, 237, 255)' }}
                >
                  <TextInput
                    className="flex-grow text-center"
                    placeholder="Description"
                    value={description}
                    onChangeText={setDescription}
                    selectTextOnFocus={true}
                  />
                </View>
              </Conditional>
              <Conditional render={feedType == FeedType.Latch}>
                <View className="mt-2 flex-row">
                  <DurationPicker
                    value={duration.left}
                    onDurationChange={(v) => {
                      setDuration((p) => ({
                        ...p,
                        left: { seconds: v.as('seconds') },
                      }));
                    }}
                  />
                  <View className="p-2" />
                  <DurationPicker
                    value={duration.right}
                    onDurationChange={(v) => {
                      setDuration((p) => ({
                        ...p,
                        right: { seconds: v.as('seconds') },
                      }));
                    }}
                  />
                </View>
              </Conditional>
              <Conditional render={feedType == FeedType.Latch}>
                <BreastTimer
                  onStop={(e) => {
                    setDuration({
                      left: {
                        seconds: e.left.duration.seconds,
                      },
                      right: {
                        seconds: e.right.duration.seconds,
                      },
                    });
                  }}
                />
              </Conditional>
            </>

            {/* Feed Form Calculator */}
            <Conditional
              render={mode == 'create' && feedType === FeedType.Formula}
            >
              <View className="px-3 mt-3 w-full">
                <FormulaCalculator targetVolume={volume} />
              </View>
            </Conditional>

            <CreateFeedButton
              disabled={disableSubmit}
              onPress={onCreateFeedPress}
            />
          </Loader>
        </View>
      </TouchableWithoutFeedback>
    );
  }
);

/**
 * Attaches the create feed button to the page
 * @returns
 */
function CreateFeedButton({
  onPress,
  disabled,
}: {
  disabled: boolean;
  onPress: () => void;
}) {
  const page = usePage();
  useEffect(() => {
    page.setBottomEl(
      <View className="px-5">
        <PrimaryButton disabled={disabled} onPress={onPress} title="Save" />
      </View>
    );
    return () => page.reset();
  }, [disabled, onPress, page]);
  return <></>;
}
