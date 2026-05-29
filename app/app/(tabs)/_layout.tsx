// Bottom tabs with the custom floating glass bar.
import React from 'react';
import { Tabs } from 'expo-router';
import { FloatingTabBar, TabId } from '@/components/FloatingTabBar';

const NAME_TO_ID: Record<string, TabId> = {
  index: 'home',
  insights: 'insights',
  progress: 'progress',
  profile: 'profile',
};
const ID_TO_NAME: Record<TabId, string> = {
  home: 'index',
  insights: 'insights',
  progress: 'progress',
  profile: 'profile',
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => {
        const route = props.state.routes[props.state.index];
        const active = NAME_TO_ID[route.name] ?? 'home';
        return (
          <FloatingTabBar
            active={active}
            onPress={(id) => props.navigation.navigate(ID_TO_NAME[id])}
          />
        );
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="insights" />
      <Tabs.Screen name="progress" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
