import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { dominantColorForSrc, imageNodeReady, imageStatusFromNode } from "../../lib/blur-image";
import { IMAGE_COPY, IMAGE_PLACEHOLDER, IMAGE_STATUS } from "../../lib/blur-image.constant";
import { cn } from "../../lib/cn";
import { duration, easeTide } from "../../lib/motion";
import { Skeleton } from "./Skeleton";

/**
 * Smart image: dominant-color placeholder, blur→sharp, lazy load, optional width/height for CLS.
 */
export function SmartImage({
  src,
  alt,
  className = "",
  imgClassName = "",
  imgStyle,
  width,
  height,
  priority = false,
  sizes,
  dominantColor,
  onStatusChange,
}) {
  const reduce = useReducedMotion();
  const [nonce, setNonce] = useState(0);
  const [status, setStatus] = useState(IMAGE_STATUS.loading);
  const fade = { duration: reduce ? 0 : duration.ui, ease: easeTide };
  const placeholder = dominantColor || dominantColorForSrc(src) || IMAGE_PLACEHOLDER;

  function mark(next) {
    setStatus(next);
    onStatusChange?.(next);
  }

  function retry(event) {
    event.preventDefault();
    event.stopPropagation();
    mark(IMAGE_STATUS.loading);
    setNonce((current) => current + 1);
  }

  if (status === IMAGE_STATUS.error) {
    return <ImageFault className={className} onRetry={retry} />;
  }

  return (
    <ImageFrame
      src={src}
      alt={alt}
      className={className}
      imgClassName={imgClassName}
      imgStyle={imgStyle}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      placeholder={placeholder}
      nonce={nonce}
      reduce={reduce}
      fade={fade}
      ready={status === IMAGE_STATUS.ready}
      loading={status === IMAGE_STATUS.loading}
      onReady={(node) => {
        if (imageNodeReady(node)) mark(IMAGE_STATUS.ready);
      }}
      onLoad={(event) => mark(imageStatusFromNode(event.currentTarget))}
      onFault={() => mark(IMAGE_STATUS.error)}
    />
  );
}

function ImageFrame({
  src,
  alt,
  className,
  imgClassName,
  imgStyle,
  width,
  height,
  sizes,
  priority,
  placeholder,
  nonce,
  reduce,
  fade,
  ready,
  loading,
  onReady,
  onLoad,
  onFault,
}) {
  const ratio =
    typeof width === "number" && typeof height === "number" && width > 0 && height > 0
      ? `${width} / ${height}`
      : undefined;

  return (
    <span
      className={cn("relative block overflow-hidden", className)}
      aria-busy={loading}
      style={{
        backgroundColor: placeholder,
        aspectRatio: ratio,
      }}
    >
      {loading ? <Skeleton className="absolute inset-0 h-full w-full rounded-none" /> : null}
      {reduce ? null : (
        <motion.img
          key={`soft-${src}-${nonce}`}
          src={src}
          alt=""
          aria-hidden="true"
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          style={imgStyle}
          className={cn("pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover blur-2xl", imgClassName)}
          initial={false}
          animate={{ opacity: ready ? 0 : 1 }}
          transition={fade}
        />
      )}
      <motion.img
        key={`sharp-${src}-${nonce}`}
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        style={imgStyle}
        ref={onReady}
        onLoad={onLoad}
        onError={onFault}
        className={cn("relative h-full w-full object-cover", imgClassName)}
        initial={false}
        animate={{ opacity: ready ? 1 : 0 }}
        transition={fade}
      />
    </span>
  );
}

function ImageFault({ className, onRetry }) {
  return (
    <span
      className={cn("grid h-full min-h-28 place-items-center bg-[#efe8dc] px-3 text-center", className)}
      role="alert"
    >
      <span>
        <p className="text-sm text-navy">{IMAGE_COPY.fault}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 inline-flex h-11 cursor-pointer items-center rounded-full bg-navy px-4 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          {IMAGE_COPY.retry}
        </button>
      </span>
    </span>
  );
}

/** @deprecated Prefer SmartImage — alias kept for existing imports. */
export function BlurImage(props) {
  return <SmartImage {...props} />;
}
