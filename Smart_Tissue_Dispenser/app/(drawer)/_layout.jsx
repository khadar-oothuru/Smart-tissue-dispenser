import { Drawer } from "expo-router/drawer";
import { Ionicons } from "@expo/vector-icons";
import CustomDrawer from "../../components/CustomDrawerContent";
import React from "react";

export default function DrawerLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={({ route }) => ({
        headerShown: false,
        drawerItemStyle: route.name === "(tabs)" ? { display: "none" } : {},
        drawerIcon: ({ color, size }) => (
          <Ionicons name="menu-outline" size={size} color={color} />
        ),
      })}
    />
  );
}
