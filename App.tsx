import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import BottomTabNavigator from "@/navigation/BottomTabNavigator";
import './global.css'

export default function App() {
  return (
    <NavigationContainer>
      <BottomTabNavigator/>
    </NavigationContainer>
  );
}