interface IframePlayerProps {
  src: string;
  title?: string;
  height?: number | string;
}

/**
 * Simple iframe-based stream embedder.
 * Embeds the URL directly so tokenized .m3u8 links stay valid
 * (no HLS.js re-fetch that could strip query params).
 */
const IframePlayer = ({ src, title = 'Live Stream', height = 600 }: IframePlayerProps) => {
  return (
    <iframe
      src={src}
      title={title}
      style={{ width: '100%', height: typeof height === 'number' ? `${height}px` : height, border: 'none' }}
      allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
      allowFullScreen
    />
  );
};

export default IframePlayer;
