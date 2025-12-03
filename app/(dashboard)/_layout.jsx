// app/(dashboard)/_layout.jsx
import { UserProvider } from "../../contexts/UserContext";
import { ProfileProvider } from "../../contexts/ProfileContext";
import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import { ScrollView, RefreshControl, View } from "react-native";
import ThemedTabs from "../../components/ThemedTabs";
import usePullToRefresh from "../../hooks/usePullToRefresh";

function DashboardContent() {
  const db = useSQLiteContext();
  const { refreshControlProps } = usePullToRefresh(db);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1 }}
      refreshControl={<RefreshControl {...refreshControlProps} />}
      // Pull-to-refresh only triggers when scroll is at the very top
      scrollEventThrottle={16}
    >
      {/* Main content */}
      <ThemedTabs />
    </ScrollView>
  );
}



export default function DashboardLayout() {
  return (
    <SQLiteProvider databaseName="mquest.db">
      <ProfileProvider>
        <UserProvider>
          <DashboardContent />
        </UserProvider>
      </ProfileProvider>
    </SQLiteProvider>
  );
}
