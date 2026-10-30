import React, { useEffect, useRef } from "react";

export default function TabletopAssetThumbnail({ asset, url, ensureImages }) {
  const figure = useRef(null);
  useEffect(() => {
    if (url || !ensureImages) return;
    if (typeof IntersectionObserver === "undefined") {
      void ensureImages([asset.path]);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void ensureImages([asset.path]);
          observer.disconnect();
        }
      },
      { rootMargin: "80px" },
    );
    observer.observe(figure.current);
    return () => observer.disconnect();
  }, [asset.path, url, ensureImages]);
  return (
    <figure ref={figure}>
      {url ? (
        <img loading="lazy" alt="" src={url} />
      ) : (
        <div className="vt-thumb-placeholder" aria-hidden="true">
          {asset.kind === "map" ? "▦" : "◇"}
        </div>
      )}
      <figcaption>{asset.name}</figcaption>
    </figure>
  );
}
