import { getLucideIcon } from "@/utils/iconUtils";
import { Ionicons } from "@expo/vector-icons";
import { LucideProps } from "lucide-react-native";
import type { ComponentProps } from "react";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export const Icon = ({
  name,
  size = 15,
  color,
  iconSet = "lucide",
  ...props
}: {
  name: string;
  size?: number;
  color?: string;
  iconSet?: "lucide" | "ionicons";
} & Omit<LucideProps, "size" | "color">) => {
  if (iconSet === "ionicons") {
    return <Ionicons name={name as IoniconName} size={size} color={color ?? "currentColor"} {...props} />;
  }

  const IconComponent = getLucideIcon(name);
  return IconComponent ? <IconComponent size={size} color={color} {...props} /> : null;
};
