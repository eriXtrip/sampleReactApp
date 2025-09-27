import { UserProvider } from "../../contexts/UserContext";
import { ProfileProvider } from '../../contexts/ProfileContext';
import { SQLiteProvider } from 'expo-sqlite';
import ThemedTabs from '../../components/ThemedTabs';

export default function DashboardLayout() {
  return (
    <SQLiteProvider databaseName="mquest.db">
      <ProfileProvider>
        <UserProvider>
          <ThemedTabs />
        </UserProvider>
      </ProfileProvider>
    </SQLiteProvider>
  );
}