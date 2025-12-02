// app/(dashboard)/_layout.jsx
import { UserProvider } from "../../contexts/UserContext";
import { ProfileProvider } from '../../contexts/ProfileContext';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import ThemedTabs from '../../components/ThemedTabs';
import { ScrollView, RefreshControl } from 'react-native';
import usePullToRefresh from '../../hooks/usePullToRefresh';

// Inner component that can access SQLite context
function DashboardContent() {
  const db = useSQLiteContext(); // Get database from SQLiteProvider
  const { refreshing, onRefresh, refreshControlProps } = usePullToRefresh(db);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1 }}
      refreshControl={
        <RefreshControl {...refreshControlProps} />
      }
    >
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