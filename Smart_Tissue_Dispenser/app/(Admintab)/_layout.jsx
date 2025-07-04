import React from "react";
import { Tabs } from "expo-router";
import { View } from "react-native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import CustomTabBar from "../../components/CustomTabBar";
import SmartHeader from "../../components/SmartHeader";
import CustomDrawerContent from "../../components/CustomDrawerContent";

const Drawer = createDrawerNavigator();

const tabConfig = [
  { name: "admindash", icon: "grid-outline", label: "Dashboard" },
  { name: "AdminDeviceList", icon: "hardware-chip-outline", label: "Devices" },
  { name: "Analytics", icon: "bar-chart-outline", label: "Analytics" },
  { name: "AdminSettings", icon: "settings-outline", label: "Settings" },
];

function AdminTabsScreen() {
  return (
    <>
      <SmartHeader />
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
          }}
          tabBar={(props) => {
            // Map the tab configuration to match the screen names
            const mappedTabs = tabConfig.map((tab) => ({
              name: tab.name,
              icon: tab.icon,
              label: tab.label,
            }));

            return (
              <CustomTabBar
                tabs={mappedTabs}
                state={props.state}
                descriptors={props.descriptors}
                navigation={props.navigation}
              />
            );
          }}
        >
          <Tabs.Screen
            name="admindash"
            options={{
              title: "Dashboard",
            }}
          />
          <Tabs.Screen
            name="AdminDeviceList"
            options={{
              title: "Devices",
            }}
          />
          <Tabs.Screen
            name="AllDevicesScreen"
            options={{
              title: "All Devices",
            }}
          />
          <Tabs.Screen
            name="Analytics"
            options={{
              title: "Analytics",
            }}
          />
          <Tabs.Screen
            name="AdminSettings"
            options={{
              title: "Settings",
            }}
          />
        </Tabs>
      </View>
    </>
  );
}

export default function AdminLayout() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerPosition: "left",
      }}
    >
      <Drawer.Screen name="AdminMain" component={AdminTabsScreen} />
    </Drawer.Navigator>
  );
}
