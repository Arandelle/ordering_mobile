import React, { useState } from 'react';
import { Image, Modal, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { useMembershipQR } from '@/hooks/useMembership';
import type { ActiveMembership } from '@/types/membership.type';
import { Icon } from '../ui/Icon';

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

const CARD_HEIGHT = 220;
const GOLD = '#f3d78c';
const GOLD_SOFT = '#f3d78c99';

const VIP_TERMS = [
  'This membership card is non-transferable and must be presented upon use.',
  'Points, rewards, and benefits are subject to the membership program terms and conditions.',
  'Lost or damaged cards must be reported immediately.',
  'Harrison Management reserves the right to amend or terminate the program at any time without prior notice.',
];

const VIP_CONTACTS = [
  { icon: 'Phone', label: '+63 2 8123 4567' },
  { icon: 'Mail', label: 'info@jpfoodlab.com' },
  { icon: 'Globe', label: 'www.harrisoninasalbbq.com.ph' },
];

const VipCard = ({ membership, memberName, tierChannel, expiresAt }: VipCardProps) => {
  const [flipped, setFlipped] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const rotateY = useSharedValue(0);

  const needsQR = tierChannel === 'dinein' || tierChannel === 'both';
  const { data: qrData } = useMembershipQR(needsQR && flipped);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${rotateY.value}deg` }],
    backfaceVisibility: 'hidden' as const,
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${rotateY.value + 180}deg` }],
    backfaceVisibility: 'hidden' as const,
  }));

  const handleFlip = () => {
    const next = !flipped;
    setFlipped(next);
    rotateY.value = withTiming(next ? 180 : 0, {
      duration: 500,
      easing: Easing.bezier(0.42, 0, 0.58, 1),
    });
  };

  const [cardW, setCardW] = useState(0);
  // 1cqw equivalent; falls back to the CARD_HEIGHT-based width before first layout
  const u = (cardW || CARD_HEIGHT * (307 / 201)) / 100;

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={handleFlip}
        className="mx-4"
        style={{ height: CARD_HEIGHT }}>
        {/* Front face */}
        <Animated.View
          style={[frontStyle, { position: 'absolute', width: '100%', height: CARD_HEIGHT }]}>
          <View className="h-full w-full overflow-hidden rounded-2xl bg-[#c63405]">
            <Image
              source={require('assets/images/membership-card-front.png')}
              className="absolute h-full w-full"
              resizeMode="cover"
            />
            <Text
              style={{ color: GOLD_SOFT, fontSize: 8, letterSpacing: 3 }}
              className="absolute bottom-2 right-3">
              TAP TO FLIP
            </Text>
          </View>
        </Animated.View>

        {/* Back face */}
        <Animated.View
          style={[backStyle, { position: 'absolute', width: '100%', height: CARD_HEIGHT }]}>
          <View
            onLayout={(e) => setCardW(e.nativeEvent.layout.width)}
            className="h-full w-full overflow-hidden rounded-2xl bg-[#c63405]">
            {/* Background image */}
            <Image
              source={require('assets/images/membership-card-new-bg.png')}
              className="absolute h-full w-full -scale-x-100"
              resizeMode="cover"
            />

            <View
              style={{
                flex: 1,
                justifyContent: 'space-between',
                paddingHorizontal: 7 * u,
                paddingVertical: 5.5 * u,
              }}>
              {/* Top: member name + logo */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 3 * u,
                }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ color: GOLD, fontSize: 3.6 * u, lineHeight: 3.6 * u }}>V.I.P</Text>
                  <Text
                    numberOfLines={1}
                    className="uppercase"
                    style={{
                      color: GOLD_SOFT,
                      fontSize: 4.4 * u,
                      lineHeight: 4.4 * u * 1.25,
                      marginTop: 0.8 * u,
                      textShadowColor: 'rgba(0, 0, 0, 0.15)', // Soft dark shadow
                      textShadowOffset: { width: 0, height: 4 }, // Pushes the shadow downwards
                      textShadowRadius: 12,
                    }}>
                    {memberName}
                  </Text>
                </View>

                <Image
                  source={require('assets/images/membership-new-logo.png')}
                  style={{ width: 30 * u, height: 12 * u }}
                  resizeMode="contain"
                />
              </View>

              {/* Middle: member details + QR slot */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 3 * u,
                }}>
                <View style={{ flex: 1, minWidth: 0, gap: 2.5 * u }}>
                  <View>
                    <Text
                      className="uppercase"
                      style={{ color: GOLD, fontSize: 2.2 * u, lineHeight: 2.2 * u }}>
                      Member ID
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{ color: GOLD_SOFT, fontSize: 3.6 * u, lineHeight: 3.6 * u * 1.25 }}>
                      {membership.memberId ?? '—'}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 6 * u }}>
                    <View>
                      <Text
                        className="uppercase"
                        style={{ color: GOLD, fontSize: 2.2 * u, lineHeight: 2.2 * u }}>
                        Member Since
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={{ color: GOLD_SOFT, fontSize: 3.6 * u, lineHeight: 3.6 * u * 1.25 }}>
                        {formatCardDate(membership.paidAt)}
                      </Text>
                    </View>
                    <View>
                      <Text
                        className="uppercase"
                        style={{ color: GOLD, fontSize: 2.2 * u, lineHeight: 2.2 * u }}>
                        Valid Until
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={{ color: GOLD_SOFT, fontSize: 3.6 * u, lineHeight: 3.6 * u * 1.25 }}>
                        {formatCardDate(expiresAt)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* QR slot */}
                <View
                  style={{
                    width: 18 * u,
                    aspectRatio: 1,
                    marginRight: 4 * u,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  {needsQR ? (
                    qrData?.memberId ? (
                      <TouchableOpacity onPress={() => setQrModalOpen(true)}>
                        <QRCode
                          value={qrData.memberId}
                          size={18 * u}
                          color={GOLD}
                          backgroundColor="transparent"
                        />
                      </TouchableOpacity>
                    ) : (
                      <View className="h-full w-full items-center justify-center rounded-lg border border-[#f3d78c]/30">
                        <Ionicons
                          name="qr-code-outline"
                          size={Math.max(14, 6 * u)}
                          color={GOLD_SOFT}
                        />
                      </View>
                    )
                  ) : (
                    <Image
                      source={require('assets/images/membership-card-logo.png')}
                      style={{ width: 18 * u, aspectRatio: 307 / 291, opacity: 0.8 }}
                      resizeMode="contain"
                    />
                  )}
                </View>
              </View>

              {/* Terms */}
              <View>
                <Text
                  className="font-medium uppercase"
                  style={{ color: GOLD_SOFT, fontSize: 1.6 * u, lineHeight: 1.6 * u * 1.25 }}>
                  Terms & Conditions
                </Text>
                <View style={{ marginTop: 0.4 * u }}>
                  {VIP_TERMS.map((term, i) => (
                    <Text
                      key={i}
                      style={{ color: GOLD_SOFT, fontSize: 1.5 * u, lineHeight: 1.5 * u * 1.375 }}>
                      {i + 1}. {term}
                    </Text>
                  ))}
                </View>
              </View>
              <View
                className="h-px w-full"
                style={{ marginTop: 1.8 * u, backgroundColor: GOLD_SOFT }}
              />
              {/* Footer */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTopColor: GOLD_SOFT,
                  paddingTop: 1.8 * u,
                }}>
                {VIP_CONTACTS.map(({ icon, label }) => (
                  <View
                    key={label}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 1 * u }}>
                    <Icon name={icon} size={2.2 * u} color={GOLD_SOFT} />
                    <Text numberOfLines={1} style={{ color: GOLD_SOFT, fontSize: 1.6 * u }}>
                      {label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
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
            <Text className="mt-3 font-mono text-xs text-gray-500">{qrData?.memberId}</Text>
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
