import { forwardRef, useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image as RNImage,
  View,
  type ImageProps as RNImageProps,
  type ImageSourcePropType,
  type ImageStyle,
} from "react-native";
import { Icon } from "./Icon";
import { twMerge } from "tailwind-merge";

// Local fallback for when no remote URI is provided
const LOCAL_FALLBACK = require("assets/images/char-icon.jpg");

// ─── Types ────────────────────────────────────────────────────────────────────

export type DynamicImageVariant =
  | "product"
  | "profile"
  | "banner"
  | "logo"
  | "order"
  | "generic";

export interface DynamicImageProps
  extends Omit<RNImageProps, "source" | "onLoad" | "onError"> {
  /** Remote URI or local require() source */
  src?: string | undefined;
  /** Accessibility label */
  alt?: string;
  /** Determines the fallback icon */
  variant?: DynamicImageVariant;
  /** Override the fallback icon entirely */
  fallbackIcon?: string;
  /** Override loading spinner color */
  tintColor?: string;
  imageClassName?: string;
  containerClassName?: string;
  containerStyle?: ImageStyle;
}

// ─── Fallback icon map ────────────────────────────────────────────────────────

const FALLBACK_ICON: Record<DynamicImageVariant, string> = {
  product: "Utensils",
  profile: "User",
  banner: "Image",
  logo: "Store",
  order: "Flame",
  generic: "FileX",
};

const FALLBACK_BG: Record<DynamicImageVariant, string> = {
  product: "#fff3ee",
  profile: "#fff7ed",
  banner: "#f5f0ed",
  logo: "#f9f5f2",
  order: "#fff7ed",
  generic: "#f9fafb",
};

const ICON_SIZE: Record<DynamicImageVariant, number> = {
  product: 22,
  profile: 24,
  banner: 20,
  logo: 18,
  order: 22,
  generic: 20,
};

const ICON_COLOR: Record<DynamicImageVariant, string> = {
  product: "#fdba74",
  profile: "#e13e00",
  banner: "#d1d5db",
  logo: "#9ca3af",
  order: "#fdba74",
  generic: "#d1d5db",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveSource(src?: string | null): ImageSourcePropType {
  if (!src) return LOCAL_FALLBACK;
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:")) {
    return { uri: src };
  }
  // Treat as a local bundled asset path — use the static fallback
  return LOCAL_FALLBACK;
}

function FallbackPlaceholder({
  variant,
  fallbackIcon,
}: {
  variant: DynamicImageVariant;
  fallbackIcon?: string;
}) {
  const icon = fallbackIcon ?? FALLBACK_ICON[variant];
  const size = ICON_SIZE[variant];
  const color = ICON_COLOR[variant];
  const bg = FALLBACK_BG[variant];

  return (
    <View
      style={{ backgroundColor: bg }}
      className="absolute inset-0 items-center justify-center">
      <Icon name={icon} size={size} color={color} />
    </View>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export const DynamicImage = forwardRef<View, DynamicImageProps>(
  (
    {
      src,
      alt = "Image",
      variant = "generic",
      fallbackIcon,
      tintColor = "#e13e00",
      imageClassName,
      containerClassName,
      containerStyle,
      style,
      resizeMode = "cover",
      ...rest
    },
    ref,
  ) => {
    const [hasError, setHasError] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Reset state when src changes
    useEffect(() => {
      setIsLoaded(false);
      setHasError(false);
    }, [src]);

    const source = resolveSource(src);

    const handleError = useCallback(() => setHasError(true), []);
    const handleLoad = useCallback(() => setIsLoaded(true), []);

    // Already errored → show fallback immediately
    if (hasError) {
      return (
        <View
          ref={ref}
          style={containerStyle}
          className={twMerge("overflow-hidden", containerClassName)}
          accessibilityRole="image"
          accessibilityLabel={`${alt} not available`}>
          <FallbackPlaceholder variant={variant} fallbackIcon={fallbackIcon} />
        </View>
      );
    }

    return (
      <View
        ref={ref}
        style={containerStyle}
        className={twMerge("overflow-hidden", containerClassName)}>
        {/* Loading overlay */}
        {!isLoaded && (
          <View
            style={{ backgroundColor: FALLBACK_BG[variant] }}
            className="absolute inset-0 items-center justify-center">
            <ActivityIndicator size="small" color={tintColor} />
          </View>
        )}

        <RNImage
          source={source}
          accessibilityLabel={alt}
          resizeMode={resizeMode}
          style={[
            { opacity: isLoaded ? 1 : 0 },
            style as ImageStyle,
          ]}
          className={twMerge(
            "h-full w-full",
            imageClassName,
          )}
          onLoad={handleLoad}
          onError={handleError}
          {...rest}
        />
      </View>
    );
  },
);

DynamicImage.displayName = "DynamicImage";

export default DynamicImage;
