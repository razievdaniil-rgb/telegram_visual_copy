import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { kitAssets } from './kit-assets';

// Figma 6973:36423: gradient fills translated directly, pattern SVG unmodified.
export function Wallpaper() {
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { overflow: 'hidden', backgroundColor: '#F7AD6A' }]}
    >
      <Svg width="100%" height="100%" viewBox="0 0 402 874" preserveAspectRatio="none">
        <Defs>
          <RadialGradient
            id="tl"
            gradientUnits="userSpaceOnUse"
            cx="0"
            cy="0"
            r="10"
            gradientTransform="matrix(20.1 43.7 20.1 -14.632 0 0)"
          >
            <Stop offset="0" stopColor="#F1D287" />
            <Stop offset="0.0001" stopColor="#E2D04F" />
            <Stop offset="1" stopColor="#F1D287" stopOpacity={0.11001} />
          </RadialGradient>
          <RadialGradient
            id="tr"
            gradientUnits="userSpaceOnUse"
            cx="0"
            cy="0"
            r="10"
            gradientTransform="matrix(-20.1 43.7 -20.1 -14.632 402 0)"
          >
            <Stop offset="0" stopColor="#F7A161" />
            <Stop offset="1" stopColor="#F7A161" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient
            id="br"
            gradientUnits="userSpaceOnUse"
            cx="0"
            cy="0"
            r="10"
            gradientTransform="matrix(-20.1 -43.7 -20.403 14.852 402 874)"
          >
            <Stop offset="0" stopColor="#E9CF68" />
            <Stop offset="1" stopColor="#E9CF68" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient
            id="bl"
            gradientUnits="userSpaceOnUse"
            cx="0"
            cy="0"
            r="10"
            gradientTransform="matrix(20.1 -43.7 40.2 29.263 0 874)"
          >
            <Stop offset="0" stopColor="#F9A66F" />
            <Stop offset="1" stopColor="#F9A66F" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        {['tl', 'tr', 'br', 'bl'].map((id) => (
          <Rect key={id} width={402} height={874} fill={`url(#${id})`} />
        ))}
      </Svg>
      <Image
        source={kitAssets.patterns}
        contentFit="contain"
        style={{
          position: 'absolute',
          width: 507,
          height: 873,
          top: '50%',
          left: '50%',
          marginTop: -436.5,
          marginLeft: -253.5,
        }}
      />
    </View>
  );
}
