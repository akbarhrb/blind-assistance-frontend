import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { ArrowLeft, User, Box } from "lucide-react-native";
import { useIsFocused } from "@react-navigation/native";
import { apiRequest } from "../utils/api";

const LogsScreen = ({ navigation }) => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      fetchLogs(activeFilter);
    }
  }, [isFocused, activeFilter]);

  const fetchLogs = async (filter) => {
    try {
      setLoading(true);
      const query = filter === "all" ? "" : `?kind=${filter}`;
      const data = await apiRequest(`/logs${query}`);
      setLogs(data);
    } catch (error) {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detection Log</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === "all" && styles.activeFilter]}
          onPress={() => setActiveFilter("all")}
        >
          <Text style={activeFilter === "all" ? styles.activeFilterText : styles.filterText}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === "face" && styles.activeFilter]}
          onPress={() => setActiveFilter("face")}
        >
          <Text style={activeFilter === "face" ? styles.activeFilterText : styles.filterText}>
            Faces
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === "object" && styles.activeFilter]}
          onPress={() => setActiveFilter("object")}
        >
          <Text style={activeFilter === "object" ? styles.activeFilterText : styles.filterText}>
            Objects
          </Text>
        </TouchableOpacity>
      </View>

      {/* Scrollable Log List */}
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={true}>
        {loading ? (
          <ActivityIndicator color="#2DD4BF" style={{ marginTop: 20 }} />
        ) : logs.length === 0 ? (
          <Text style={styles.emptyText}>No logs yet.</Text>
        ) : (
          logs.map((log) => (
            <View key={log.id} style={styles.logCard}>
              <View
                style={[
                  styles.iconWrapper,
                  log.kind === "face" ? styles.faceIconBg : styles.objectIconBg,
                ]}
              >
                {log.kind === "face" ? (
                  <User size={22} color="#2DD4BF" />
                ) : (
                  <Box size={22} color="#F59E0B" />
                )}
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.itemName}>{log.label}</Text>
                <Text style={styles.itemTime}>
                  {new Date(log.created_at).toLocaleString()}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 25,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    marginLeft: 20,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
    justifyContent: "space-between",
  },
  filterTab: {
    flex: 1,
    height: 60,
    backgroundColor: "#1E293B",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
  },
  activeFilter: {
    backgroundColor: "#2DD4BF",
  },
  filterText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  activeFilterText: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "700",
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyText: {
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
  },
  logCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 25,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  iconWrapper: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    justifyContent: "center",
    alignItems: "center",
  },
  faceIconBg: {
    backgroundColor: "rgba(45, 212, 191, 0.15)",
  },
  objectIconBg: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
  },
  textContainer: {
    marginLeft: 15,
  },
  itemName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  itemTime: {
    color: "#94A3B8",
    fontSize: 14,
  },
});

export default LogsScreen;
