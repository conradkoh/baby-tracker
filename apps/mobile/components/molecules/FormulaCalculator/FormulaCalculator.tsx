import { FC } from 'react';
import { Text, View } from 'react-native';

export interface FormatCalculatorProps {
  targetVolume: number;
}

export const FormulaCalculator: FC<FormatCalculatorProps> = (props) => {
  const estimate = calculateWaterVolumes({
    targetVolume: props.targetVolume,
    targetTemperatureCelsius: 47,
    volumeIncreasePerML: 20 / 140,
    roomTempCelsius: 25,
  });
  return (
    <>
      <View className="items-start ">
        <Text className="text-lg font-bold">Formula Calculator</Text>
        <View className="w-full">
          <Text>
            Room Temp Water Vol: {Math.ceil(estimate.roomTempWater)} ml
          </Text>
          <Text>Boiling Water Vol: {Math.ceil(estimate.roomTempWater)} ml</Text>
        </View>
      </View>
    </>
  );
};
export interface CalculateWaterVolumeParams {
  targetVolume: number;
  targetTemperatureCelsius: number;
  volumeIncreasePerML: number;
  roomTempCelsius: number;
}
export function calculateWaterVolumes(props: CalculateWaterVolumeParams): {
  roomTempWater: number;
  boilingWater: number;
} {
  // Constants for water temperatures
  // const roomTemp = 25; // Assuming room temperature is 25°C
  const boilingTemp = 100; // Boiling temperature of water

  // Calculate the initial volume of water needed before adding milk powder
  const initialWaterVolume =
    props.targetVolume / (1 + props.volumeIncreasePerML);

  // Using the formula (m1*c1 + m2*c2) / (m1 + m2) = targetTemperature
  // where m1 and m2 are the masses (volumes, in this case) of the two water temperatures,
  // c1 and c2 are the temperatures of the water,
  // Solve for m1 and m2 ratio given the targetTemperature
  // For simplicity, assume the specific heat capacity is constant and cancels out in the equation

  // Let x be the volume of room temperature water, then initialWaterVolume - x is the volume of boiling water
  // (x*roomTemp + (initialWaterVolume - x)*boilingTemp) / initialWaterVolume = targetTemperature
  // Simplify to find x
  const x =
    (initialWaterVolume * props.targetTemperatureCelsius -
      initialWaterVolume * boilingTemp) /
    (props.roomTempCelsius - boilingTemp);

  // The volume of boiling water is the rest of the water
  const boilingWater = initialWaterVolume - x;

  return {
    roomTempWater: x,
    boilingWater: boilingWater,
  };
}
