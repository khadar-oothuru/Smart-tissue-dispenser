// context/TabBarContext.js
import React from "react";

export const TabBarContext = React.createContext({
  tabBarHeight: 0,
});

export const TabBarProvider = ({ children, tabBarHeight }) => {
  return (
    <TabBarContext.Provider value={{ tabBarHeight }}>
      {children}
    </TabBarContext.Provider>
  );
};

export const useTabBarHeight = () => React.useContext(TabBarContext).tabBarHeight;