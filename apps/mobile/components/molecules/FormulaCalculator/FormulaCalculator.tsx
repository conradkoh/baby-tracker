import { FC } from 'react';
import { Text, View } from 'react-native';

export interface FormatCalculatorProps {
  targetVolume: number;
}

export const FormulaCalculator: FC<FormatCalculatorProps> = (props) => {
  const volIncreasePerScoop = 10;
  const waterMlPerScoop = 60;

  const estimate = calculateWaterVolumes({
    targetVolume: props.targetVolume,
    targetTemperatureCelsius: 47,
    waterMLPerScoop: waterMlPerScoop,
    volMLIncreasedPerScoop: volIncreasePerScoop,
    roomTempCelsius: 25,
  });
  const totalVol = estimate.boilingWater + estimate.roomTempWater;
  const milkPowderScoops = totalVol / waterMlPerScoop;
  return (
    <>
      <View className="items-start ">
        <Text className="text-lg font-bold">Formula Calculator</Text>
        <View className="w-full">
          <Text>
            No. of Scoops: {Math.round(milkPowderScoops * 100) / 100} scoops
          </Text>
          <Text>
            Total Water Vol:{' '}
            {Math.round(estimate.roomTempWater + estimate.boilingWater)} ml
          </Text>
          <Text>
            Room Temp Water Vol: {Math.round(estimate.roomTempWater)} ml
          </Text>
          <Text>Boiling Water Vol: {Math.round(estimate.boilingWater)} ml</Text>
        </View>
      </View>
    </>
  );
};
export interface CalculateWaterVolumeParams {
  targetVolume: number; //the final target volume
  targetTemperatureCelsius: number; //the target temperature
  volMLIncreasedPerScoop: number; //volume added by each scoop of powder
  waterMLPerScoop: number; //the amount of water to be added for each scoop of powder
  roomTempCelsius: number; //room temperature in celsius
}
export function calculateWaterVolumes(props: CalculateWaterVolumeParams): {
  roomTempWater: number;
  boilingWater: number;
} {
  // Constants for water temperatures
  const boilingTemp = 100; // Boiling temperature of water

  // Calculate the initial volume of water needed before adding milk powder
  const fr =
    props.waterMLPerScoop /
    (props.volMLIncreasedPerScoop + props.waterMLPerScoop);
  const initialWaterVolume = props.targetVolume * fr;

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
