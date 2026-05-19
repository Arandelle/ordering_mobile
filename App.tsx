import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import BottomTabNavigator from "@/navigation/BottomTabNavigator";
import './global.css'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <BottomTabNavigator/>
      </NavigationContainer>
    </QueryClientProvider>
  );
}