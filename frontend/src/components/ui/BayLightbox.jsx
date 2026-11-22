import Lightbox from "yet-another-react-lightbox";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

const pluginMap = { counter: Counter, thumbnails: Thumbnails, zoom: Zoom };

const defaultZoom = {
  maxZoomPixelRatio: 3,
  scrollToZoom: true,
  doubleTapDelay: 300,
  doubleClickDelay: 300,
  pinch: true,
};

export function BayLightbox({
  plugins = ["thumbnails", "zoom"],
  zoom = defaultZoom,
  controller,
  ...props
}) {
  return (
    <Lightbox
      plugins={plugins.map((name) => pluginMap[name]).filter(Boolean)}
      zoom={{ ...defaultZoom, ...zoom }}
      controller={{ closeOnBackdropClick: true, closeOnPullDown: true, ...controller }}
      {...props}
    />
  );
}
