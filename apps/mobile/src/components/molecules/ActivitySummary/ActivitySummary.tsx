import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Assuming you're using Expo

interface ToolbarProps {
  lastFeed: string;
  feedVolume3HAvg: number;
  feedVolume24HTotal: number;
}

interface InfoItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

const ActivitySummary: React.FC<ToolbarProps> = ({
  lastFeed,
  feedVolume3HAvg,
  feedVolume24HTotal,
}) => {
  return (
    <View className="bg-purple-100 p-3 rounded-lg shadow-md">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-lg font-bold text-purple-800">
          Activity Summary{' '}
        </Text>
      </View>

      <View className="flex-row justify-between">
        <InfoItem icon="time-outline" label="Last Feed" value={lastFeed} />
        <InfoItem
          icon="flask-outline"
          label="3h Feed Avg"
          value={`${feedVolume3HAvg}ml`}
        />
        <InfoItem
          icon="calendar-outline"
          label="24h Feed Total"
          value={`${feedVolume24HTotal}ml`}
        />
      </View>
    </View>
  );
};

const InfoItem: React.FC<InfoItemProps> = ({ icon, label, value }) => (
  <View className="items-center flex-1">
    <Ionicons name={icon} size={24} color="#6B46C1" />
    <Text className="text-xs text-purple-600 mt-1">{label}</Text>
    <Text className="text-sm font-semibold text-purple-800">{value}</Text>
  </View>
);

export default ActivitySummary;
