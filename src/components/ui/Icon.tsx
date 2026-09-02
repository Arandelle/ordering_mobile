import { getLucideIcon } from "@/utils/iconUtils";
import { LucideProps } from "lucide-react-native";

export const Icon = ({
  name,
  size = 15,
  ...props
}: {
  name: string;
} & LucideProps) => {
  const IconComponent = getLucideIcon(name);
  return IconComponent ? <IconComponent size={size} {...props} /> : null;
};
