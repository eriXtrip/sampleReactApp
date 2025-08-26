// utils/youtube.js
export function getYouTubeEmbedUrl(url) {
  try {
    // Example: https://www.youtube.com/watch?v=abcd1234
    const watchRegex = /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/;
    const shortRegex = /youtu\.be\/([a-zA-Z0-9_-]+)/;

    let videoId = null;

    if (watchRegex.test(url)) {
      videoId = url.match(watchRegex)[1];
    } else if (shortRegex.test(url)) {
      videoId = url.match(shortRegex)[1];
    }

    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }

    return url; // fallback if not a YouTube link
  } catch (err) {
    return url;
  }
}
