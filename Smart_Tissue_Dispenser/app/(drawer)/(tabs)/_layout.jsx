// app/(drawer)/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";
import CustomTabBar from "../../../components/CustomTabBar";
import SmartHeader from "../../../components/SmartHeader";

const tabConfig = [
  { name: "Home", icon: "home-outline", label: "Home" },
  // { name: "DeviceList", icon: "search-outline", label: "Devices" },
  { name: "Demo", icon: "flash-outline", label: "Help"},
  { name: "profile", icon: "person-outline", label: "Profile" },
];

export default function TabLayout() {
  return (
    <>
      <SmartHeader />

      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: { display: "none" }, // Hide default tab bar
          }}
        >
          <Tabs.Screen
            name="Home"
            options={{
              title: "Home",
            }}
          />
          {/* <Tabs.Screen
            name="DeviceList"
            options={{
              title: "Devices",
            }}
          /> */}
          <Tabs.Screen
            name="Demo"
            options={{
              title: "Demo",
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: "Profile",
              headerShown: false,
              tabBarStyle: { display: "none" },
            }}
          />
        </Tabs>

        <CustomTabBar tabs={tabConfig} />
      </View>
    </>
  );
}
