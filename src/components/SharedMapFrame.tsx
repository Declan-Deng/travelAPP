import { Platform } from "react-native";

type Props = {
  html: string;
  frameId: string;
  selectedSpotId?: string | null;
  onSelectSpot: (spotId: string) => void;
  onTilesReady: () => void;
};

const SharedMapFrame =
  Platform.OS === "web"
    ? (require("./SharedMapFrame.web").default as React.ComponentType<Props>)
    : (require("./SharedMapFrame.native").default as React.ComponentType<Props>);

export default SharedMapFrame;
