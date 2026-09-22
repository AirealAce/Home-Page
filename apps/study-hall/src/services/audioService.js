let playing = [],
  generation = 0;
export function stopAudio() {
  generation++;
  playing.forEach((a) => {
    a.pause();
    a.src = "";
  });
  playing = [];
}
export async function replayAudio(urls, onError) {
  stopAudio();
  const token = generation;
  for (const url of urls) {
    if (token !== generation) break;
    const audio = new Audio(url);
    playing.push(audio);
    try {
      await new Promise((resolve, reject) => {
        audio.onended = resolve;
        audio.onpause = resolve;
        audio.onerror = () => reject(new Error("Audio unavailable"));
        audio.play().catch(reject);
      });
    } catch {
      if (token === generation)
        onError(
          "Audio could not play. Select Replay Audio to try again, or check whether this browser supports the file.",
        );
      break;
    }
  }
}
