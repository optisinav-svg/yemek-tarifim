import Svg, { Circle, Path, Rect, G } from "react-native-svg";
import type { CountryCode } from "./recipe-data";

type FlagProps = { size?: number };

function TurkeyFlag({ size = 20 }: FlagProps) {
  const w = size * 1.5;
  const h = size;
  return (
    <Svg width={w} height={h} viewBox="0 0 30 20">
      <Rect width="30" height="20" fill="#E30A17" />
      <Circle cx="12" cy="10" r="5.5" fill="#FFFFFF" />
      <Circle cx="13.3" cy="10" r="4.4" fill="#E30A17" />
      <Path
        d="M19 10 L23.5 8.5 L20.7 12.3 L20.7 7.7 L23.5 11.5 Z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

function AzerbaijanFlag({ size = 20 }: FlagProps) {
  const w = size * 1.5;
  const h = size;
  return (
    <Svg width={w} height={h} viewBox="0 0 30 20">
      <Rect width="30" height="6.67" y="0" fill="#00B9E4" />
      <Rect width="30" height="6.67" y="6.67" fill="#E4312B" />
      <Rect width="30" height="6.67" y="13.33" fill="#3F9C35" />
      <Circle cx="15" cy="10" r="3.2" fill="#FFFFFF" />
      <Circle cx="15.9" cy="10" r="2.6" fill="#E4312B" />
      <Path d="M19.2 10 L22.3 9 L20.3 11.9 L20.3 8.1 L22.3 11 Z" fill="#FFFFFF" />
    </Svg>
  );
}

function WorldFlag({ size = 20 }: FlagProps) {
  const w = size * 1.5;
  const h = size;
  return (
    <Svg width={w} height={h} viewBox="0 0 30 20">
      <Rect width="30" height="20" rx="3" fill="#4A90D9" />
      <G opacity={0.85}>
        <Path d="M4 6 Q7 4 10 6 T16 6 Q19 5 22 7 L21 10 Q17 9 14 11 T7 11 Z" fill="#7CC576" />
        <Path d="M12 12 Q16 11 20 13 T27 12 L26 16 Q21 15 17 17 T10 16 Z" fill="#7CC576" />
      </G>
    </Svg>
  );
}

/** Ülke koduna göre çizilmiş (SVG) bayrak simgesi; emoji bayrak font desteğine bağlı değildir. */
export function CountryFlagIcon({ code, size = 20 }: { code: CountryCode | string; size?: number }) {
  if (code === "TR") return <TurkeyFlag size={size} />;
  if (code === "AZ") return <AzerbaijanFlag size={size} />;
  return <WorldFlag size={size} />;
}
