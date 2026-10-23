import React from 'react';
import { Platform, View, type ViewStyle } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { Image } from 'expo-image';
import { Asset } from 'expo-asset';

const sources = {
  profile: [
    require('../assets/telegram/profile-imgIcon1.svg'),
    require('../assets/telegram/profile-imgIcon2.svg'),
    require('../assets/telegram/profile-imgIcon3.svg'),
    require('../assets/telegram/profile-imgIcon4.svg'),
  ],
  settings: [
    require('../assets/telegram/settings-imgIcon.svg'),
    require('../assets/telegram/settings-imgIcon1.svg'),
    require('../assets/telegram/settings-imgIcon2.svg'),
    require('../assets/telegram/settings-imgIcon3.svg'),
  ],
};
const masks = {
  profile: require('../assets/telegram/profile-imgIcons.svg'),
  settings: require('../assets/telegram/settings-imgIcons.svg'),
};
// Exact placements from I6802:22955;6800:21913 and I6802:5689;6800:22188.
const placements = [
  [161.5, 14, 24, 0],
  [225.5, 124, 24, 0],
  [96.5, 124, 24, 0],
  [109.5, 176, 24, 0],
  [98.5, 52, 20, 1],
  [59.5, 90, 20, 1],
  [112.5, 2, 18, 2],
  [1.5, 90, 20, 1],
  [50.5, 27, 16, 3],
  [49.5, 156, 20, 1],
  [164.5, 165, 18, 2],
  [216.5, 180, 18, 2],
  [278.5, 156, 18, 2],
  [266.5, 91, 18, 2],
  [278.5, 25, 18, 2],
  [215.5, 3, 18, 2],
  [322.5, 88, 24, 0],
  [229.5, 55, 16, 3],
];
export function ProfilePattern({ variant }: { variant: 'profile' | 'settings' }) {
  const children = placements.map(([x, y, size, index], i) => (
    <Image
      key={i}
      source={sources[variant][index]}
      tintColor="#17628E"
      contentFit="contain"
      style={{ position: 'absolute', left: x, top: y, width: size, height: size, opacity: 0.45 }}
    />
  ));
  const style: ViewStyle = {
    position: 'absolute',
    width: 349,
    height: 203,
    left: '50%',
    marginLeft: -176.5,
    top: variant === 'settings' ? -17 : -49,
  };
  if (Platform.OS === 'web')
    return (
      <View
        pointerEvents="none"
        style={[
          style,
          {
            maskImage: `url("${Asset.fromModule(masks[variant]).uri}")`,
            maskSize: '476px 379px',
            maskPosition: '-62px -97px',
            maskRepeat: 'no-repeat',
          } as ViewStyle,
        ]}
      >
        {children}
      </View>
    );
  return (
    <MaskedView
      pointerEvents="none"
      style={style}
      maskElement={
        <View style={{ width: 349, height: 203, overflow: 'hidden' }}>
          <Image
            source={masks[variant]}
            contentFit="contain"
            style={{ position: 'absolute', width: 476, height: 379, left: -62, top: -97 }}
          />
        </View>
      }
    >
      {children}
    </MaskedView>
  );
}
