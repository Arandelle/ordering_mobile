import { Dimensions, Platform } from "react-native";

// Android emulator: use 10.0.2.2 to reach host machine localhost
// iOS simulator: use localhost
// Physical device: use your machine's LAN IP (e.g. 192.168.x.x)
export const APP_URL = __DEV__
  ? 'http://192.168.110.215:3000'
  : 'https://food.harrisoninasalbbq.com.ph';

export const TERMS_OF_USE_URL = `${APP_URL}/policies/terms-of-use`;
export const PRIVACY_POLICY_URL = `${APP_URL}/policies/privacy-policy`;


export const SCREEN_HEIGHT = Dimensions.get('screen').height;