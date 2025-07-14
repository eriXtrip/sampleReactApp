import { UserProvider } from "../../contexts/UserContext";
import { SQLiteProvider } from 'expo-sqlite';
import ThemedTabs from '../../components/ThemedTabs';

export default function DashboardLayout() {
  return (
    <SQLiteProvider databaseName="mydatabase.db">
      <UserProvider>
        <ThemedTabs />
      </UserProvider>
    </SQLiteProvider>
  );
}