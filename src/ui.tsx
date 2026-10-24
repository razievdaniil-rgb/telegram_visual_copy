import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  View,
  type TextInputProps,
  type ViewStyle,
  type ColorValue,
} from 'react-native';
import { Text, TextInput } from './text';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { initials, type Profile } from './model';
import { colors, systemFont } from './theme';

export const C = colors;
export function Icon({
  name,
  size = 24,
  color = C.blue,
}: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  size?: number;
  color?: ColorValue;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}
export function IconButton({
  name,
  label,
  onPress,
  color = C.blue,
}: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  color?: ColorValue;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [s.iconButton, pressed && { opacity: 0.5 }]}
    >
      <Icon name={name} color={color} />
    </Pressable>
  );
}
export function Avatar({ profile, size = 54 }: { profile: Profile; size?: number }) {
  const top = `#${[1, 3, 5]
    .map((offset) => {
      const channel = parseInt(profile.color.slice(offset, offset + 2), 16);
      return Math.round(channel + (255 - channel) * 0.25)
        .toString(16)
        .padStart(2, '0');
    })
    .join('')}`;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        backgroundColor: profile.color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {profile.avatar ? (
        <Image
          accessibilityLabel={`Аватар ${profile.firstName}`}
          source={{ uri: profile.avatar }}
          style={{ width: size, height: size }}
        />
      ) : (
        <>
          <LinearGradient colors={[top, profile.color]} style={StyleSheet.absoluteFill} />
          <Text
            allowFontScaling={false}
            style={{
              color: 'white',
              fontSize: (size * 26) / 60,
              fontWeight: '700',
              fontFamily: systemFont,
              letterSpacing: -0.3,
            }}
          >
            {initials(profile)}
          </Text>
        </>
      )}
    </View>
  );
}
export function Header({
  title,
  back,
  right,
  onSecret,
}: {
  title: string;
  back?: () => void;
  right?: React.ReactNode;
  onSecret?: () => void;
}) {
  return (
    <View style={s.header}>
      <View style={s.headerSide}>
        {back && <IconButton name="chevron-back" label="Назад" onPress={back} />}
      </View>
      <Pressable onLongPress={onSecret} delayLongPress={900} style={s.headerTitleWrap}>
        <Text numberOfLines={1} style={s.headerTitle}>
          {title}
        </Text>
      </Pressable>
      <View style={[s.headerSide, { alignItems: 'flex-end' }]}>{right}</View>
    </View>
  );
}
export function Button({
  title,
  onPress,
  danger,
  disabled,
}: {
  title: string;
  onPress: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        { backgroundColor: danger ? C.red : C.blue, opacity: disabled ? 0.4 : pressed ? 0.65 : 1 },
      ]}
    >
      <Text style={s.buttonText}>{title}</Text>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={C.muted}
        {...props}
        style={[
          s.input,
          props.multiline && { minHeight: 88, textAlignVertical: 'top' },
          props.style,
        ]}
      />
    </View>
  );
}
export function Segment<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <View style={s.segment}>
        {options.map((o) => (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected: o.value === value }}
            onPress={() => onChange(o.value)}
            style={[s.segmentItem, value === o.value && s.segmentSelected]}
          >
            <Text
              style={{
                color: value === o.value ? C.text : '#636366',
                fontSize: 13,
                textAlign: 'center',
              }}
            >
              {o.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
export function Empty({
  title,
  description,
  icon = 'chatbubbles-outline',
}: {
  title: string;
  description: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
}) {
  return (
    <View style={s.empty}>
      <Icon name={icon} size={52} color="#ADB7C4" />
      <Text style={s.emptyTitle}>{title}</Text>
      <Text style={s.emptyDescription}>{description}</Text>
    </View>
  );
}
export function Loading() {
  return (
    <View style={s.empty}>
      <ActivityIndicator size="large" color={C.blue} />
    </View>
  );
}
export const panel: ViewStyle = { paddingHorizontal: 18, paddingBottom: 32, gap: 12 };
export const s = StyleSheet.create({
  header: {
    height: 49,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    backgroundColor: C.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.line,
  },
  headerSide: { width: 72 },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: C.text },
  iconButton: { minWidth: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  button: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  field: { gap: 7, marginTop: 10 },
  label: { fontSize: 13, color: '#636366', paddingLeft: 2 },
  input: {
    backgroundColor: 'white',
    color: C.text,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.line,
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 16,
  },
  segment: { backgroundColor: '#E3E3E8', borderRadius: 9, padding: 3, flexDirection: 'row' },
  segmentItem: {
    flex: 1,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
    paddingHorizontal: 4,
  },
  segmentSelected: { backgroundColor: 'white', boxShadow: '0px 1px 3px #00000016' },
  empty: {
    flex: 1,
    minHeight: 250,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 14,
  },
  emptyTitle: { fontSize: 21, fontWeight: '600', textAlign: 'center' },
  emptyDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: C.muted,
    textAlign: 'center',
    maxWidth: 330,
  },
});
