import React, { useState } from 'react';
import { Image, Modal, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { useMembershipQR } from '@/hooks/useMembership';
import type { ActiveMembership } from '@/types/membership.type';

function formatCardDate(value?: string | null): string {
  if (!value) return '--/--/--';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '--/--/--';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}/${dd}/${d.getFullYear()}`;
}

type VipCardProps = {
  membership: ActiveMembership;
  memberName: string;
  tierChannel: string;
  expiresAt?: string | null;
};

const CARD_WIDTH = 320;
const CARD_HEIGHT = 200;
const GOLD = '#f3d78c';
const GOLD_SOFT = '#f3d78c99';

const VipCard = ({ membership, memberName, tierChannel, expiresAt }: VipCardProps) => {
  const [flipped, setFlipped] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const rotateY = useSharedValue(0);

  const needsQR = tierChannel === 'dinein' || tierChannel === 'both';
  const { data: qrData } = useMembershipQR(needsQR && flipped);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${rotateY.value}deg` }],
    backfaceVisibility: 'hidden' as const,
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${rotateY.value + 180}deg` }],
    backfaceVisibility: 'hidden' as const,
  }));

  const handleFlip = () => {
    const next = !flipped;
    setFlipped(next);
    rotateY.value = withTiming(next ? 180 : 0, { duration: 600 });
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={handleFlip}
        className="self-center mt-8"
        style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}>
        {/* Front face */}
        <Animated.View
          style={[frontStyle, { position: 'absolute', width: CARD_WIDTH, height: CARD_HEIGHT }]}>
          <View className="h-full w-full overflow-hidden rounded-2xl bg-[#c63405]">
            <Image
              source={require('assets/images/membership-card-bg.png')}
              className="absolute h-full w-full"
              resizeMode="cover"
            />
            <View className="flex-1 items-center justify-center px-6">
              <Image
                source={require('assets/images/membership-card-logo.png')}
                style={{ width: 100, height: 95 }}
                resizeMode="contain"
              />
              <Text
                style={{ color: GOLD, fontSize: 20, letterSpacing: 4, marginTop: 4 }}
                className="font-bold">
                V.I.P
              </Text>
              <Text
                numberOfLines={1}
                style={{ color: GOLD, fontSize: 12, letterSpacing: 6, marginTop: 4 }}
                className="uppercase">
                {memberName}
              </Text>
            </View>
            <Text
              style={{ color: GOLD_SOFT, fontSize: 8, letterSpacing: 3 }}
              className="absolute bottom-2 right-3">
              TAP TO FLIP
            </Text>
          </View>
        </Animated.View>

        {/* Back face */}
        <Animated.View
          style={[backStyle, { position: 'absolute', width: CARD_WIDTH, height: CARD_HEIGHT }]}>
          <View className="h-full w-full overflow-hidden rounded-2xl bg-[#c63405]">
            <Image
              source={require('assets/images/membership-card-bg.png')}
              className="absolute h-full w-full"
              resizeMode="cover"
            />
            <View className="flex-row items-center justify-between px-5 py-4">
              <View className="flex-1 gap-3">
                <View>
                  <Text style={{ color: GOLD_SOFT, fontSize: 8, letterSpacing: 3 }}>
                    MEMBER ID
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{ color: GOLD, fontSize: 16, letterSpacing: 3 }}
                    className="font-bold">
                    {membership.memberId ?? '—'}
                  </Text>
                </View>
                <View>
                  <Text style={{ color: GOLD_SOFT, fontSize: 8, letterSpacing: 3 }}>
                    MEMBER SINCE
                  </Text>
                  <Text style={{ color: GOLD, fontSize: 16, letterSpacing: 3 }} className="font-bold">
                    {formatCardDate(membership.paidAt)}
                  </Text>
                </View>
                <View>
                  <Text style={{ color: GOLD_SOFT, fontSize: 8, letterSpacing: 3 }}>
                    VALID THRU
                  </Text>
                  <Text style={{ color: GOLD, fontSize: 16, letterSpacing: 3 }} className="font-bold">
                    {formatCardDate(expiresAt)}
                  </Text>
                </View>
              </View>

              {/* QR area */}
              <View className="ml-3 items-center justify-center">
                {needsQR ? (
                  qrData?.memberId ? (
                    <TouchableOpacity onPress={() => setQrModalOpen(true)}>
                      <QRCode
                        value={qrData.memberId}
                        size={100}
                        color={GOLD}
                        backgroundColor="transparent"
                      />
                    </TouchableOpacity>
                  ) : (
                    <View className="h-24 w-24 items-center justify-center rounded-lg border border-[#f3d78c]/30">
                      <Ionicons name="qr-code-outline" size={28} color={GOLD_SOFT} />
                    </View>
                  )
                ) : (
                  <Image
                    source={require('assets/images/membership-card-logo.png')}
                    style={{ width: 60, height: 57, opacity: 0.8 }}
                    resizeMode="contain"
                  />
                )}
              </View>
            </View>
            <Text
              style={{ color: GOLD_SOFT, fontSize: 8, letterSpacing: 3 }}
              className="absolute bottom-2 left-3">
              TAP TO FLIP
            </Text>
          </View>
        </Animated.View>
      </TouchableOpacity>

      {/* Full-screen QR modal */}
      <Modal visible={qrModalOpen} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/70 px-8">
          <View className="w-full items-center rounded-3xl bg-white p-6">
            <Text className="text-lg font-bold text-gray-900">Membership QR</Text>
            <Text className="mt-1 text-xs text-gray-400">
              Show this to the cashier for dine-in verification
            </Text>
            <View className="mt-4 rounded-2xl border-2 border-gray-100 bg-white p-3">
              <QRCode
                value={qrData?.memberId ?? ''}
                size={220}
                color="#1a1a1a"
                backgroundColor="#ffffff"
              />
            </View>
            <Text className="mt-3 font-mono text-xs text-gray-500">
              {qrData?.memberId}
            </Text>
            <TouchableOpacity
              onPress={() => setQrModalOpen(false)}
              className="mt-4 rounded-xl bg-gray-100 px-8 py-3">
              <Text className="text-sm font-bold text-gray-700">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default VipCard;
