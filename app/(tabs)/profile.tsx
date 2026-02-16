import { ScrollView, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";

export default function ProfileScreen() {
  return (
    <ScreenContainer>
      <ScrollView className="flex-1 px-6 py-4">
        <Text className="text-3xl font-bold text-[#B6FFFB] mb-6 text-center">
          Profile
        </Text>

        {/* Privacy Policy Section */}
        <View className="mb-8">
          <Text className="text-2xl font-bold text-[#B6FFFB] mb-4">
            Privacy Policy
          </Text>

          <View className="mb-6">
            <Text className="text-lg font-semibold text-white mb-2">
              Data Collection
            </Text>
            <Text className="text-base text-gray-300 leading-relaxed">
              YaYa Math collects minimal data to enable competitive gameplay. When you submit scores to the leaderboard, we collect:
            </Text>
            <Text className="text-base text-gray-300 leading-relaxed ml-4 mt-2">
              • Your 3-character initials (chosen by you)
            </Text>
            <Text className="text-base text-gray-300 leading-relaxed ml-4">
              • Your score and completion time
            </Text>
            <Text className="text-base text-gray-300 leading-relaxed ml-4">
              • The operation type and difficulty level
            </Text>
          </View>

          <View className="mb-6">
            <Text className="text-lg font-semibold text-white mb-2">
              Data Usage
            </Text>
            <Text className="text-base text-gray-300 leading-relaxed">
              Your data is used exclusively to display global leaderboards and enable users to compete against one another. We do not:
            </Text>
            <Text className="text-base text-gray-300 leading-relaxed ml-4 mt-2">
              • Sell your data to third parties
            </Text>
            <Text className="text-base text-gray-300 leading-relaxed ml-4">
              • Use your data for advertising
            </Text>
            <Text className="text-base text-gray-300 leading-relaxed ml-4">
              • Share your data with anyone outside of the app
            </Text>
            <Text className="text-base text-gray-300 leading-relaxed ml-4">
              • Track your personal identity or location
            </Text>
          </View>

          <View className="mb-6">
            <Text className="text-lg font-semibold text-white mb-2">
              Local Data
            </Text>
            <Text className="text-base text-gray-300 leading-relaxed">
              The following data is stored locally on your device and never sent to our servers:
            </Text>
            <Text className="text-base text-gray-300 leading-relaxed ml-4 mt-2">
              • Personal best scores
            </Text>
            <Text className="text-base text-gray-300 leading-relaxed ml-4">
              • Achievement progress
            </Text>
            <Text className="text-base text-gray-300 leading-relaxed ml-4">
              • Practice statistics and history
            </Text>
            <Text className="text-base text-gray-300 leading-relaxed ml-4">
              • Daily challenge streak counter
            </Text>
          </View>

          <View className="mb-6">
            <Text className="text-lg font-semibold text-white mb-2">
              Data Security
            </Text>
            <Text className="text-base text-gray-300 leading-relaxed">
              All data transmitted to our servers is encrypted using industry-standard HTTPS protocols. Leaderboard data is stored securely and is only accessible through the app.
            </Text>
          </View>

          <View className="mb-6">
            <Text className="text-lg font-semibold text-white mb-2">
              Children's Privacy
            </Text>
            <Text className="text-base text-gray-300 leading-relaxed">
              YaYa Math is designed for users of all ages. We do not knowingly collect personal information from children. The app only collects anonymous initials and scores for leaderboard purposes.
            </Text>
          </View>

          <View className="mb-6">
            <Text className="text-lg font-semibold text-white mb-2">
              Contact
            </Text>
            <Text className="text-base text-gray-300 leading-relaxed">
              If you have questions about this privacy policy or your data, please contact us through the App Store.
            </Text>
          </View>

          <Text className="text-sm text-gray-400 mt-4 text-center">
            Last updated: February 16, 2026
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
