export interface AudioVisualizerProps {
  spectrum: number[];
  volume: number;
  isPlaying?: boolean;
  isLoading?: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  spectrum,
  volume,
  isPlaying,
  isLoading,
}) => {
  const firstNonZeroIndex = spectrum.findIndex(value => value > 0);
  const lastNonZeroIndex = spectrum
    .slice()
    .reverse()
    .findIndex(value => value > 0);
  const filteredSpectrum = spectrum.slice(firstNonZeroIndex, spectrum.length - lastNonZeroIndex);
  const myVolume = isPlaying ? 0 : volume;
  const spectrumLength = filteredSpectrum.length;
  const spectrumLengthForth = spectrumLength / 4;
  const meterValue1 = isPlaying
    ? Math.floor(filteredSpectrum.slice(0, spectrumLengthForth).reduce((a, b) => a + b, 0)) /
      spectrumLengthForth
    : 1;
  const meterValue2 = isPlaying
    ? Math.floor(
        filteredSpectrum
          .slice(spectrumLengthForth, spectrumLengthForth * 2)
          .reduce((a, b) => a + b, 0)
      ) / spectrumLengthForth
    : 1;
  const meterValue3 = isPlaying
    ? Math.floor(
        filteredSpectrum
          .slice(spectrumLengthForth * 2, spectrumLengthForth * 3)
          .reduce((a, b) => a + b, 0)
      ) / spectrumLengthForth
    : 1;
  const meterValue4 = isPlaying
    ? Math.floor(filteredSpectrum.slice(spectrumLengthForth * 3).reduce((a, b) => a + b, 0)) /
      spectrumLengthForth
    : 1;

  const rbgColors = ['bg-[#ff0000]', 'bg-[#00ff00]', 'bg-[#0000ff]', 'bg-[#ff00ff]'];
  const spinAnimations = [
    'animate-[spin_28s_linear_infinite]',
    'animate-[spin_24s_linear_infinite_-3000ms]',
    'animate-[spin_32s_linear_infinite_-6000ms]',
    'animate-[spin_20s_linear_infinite_-9000ms]',
  ];
  const roundedAnimations = [
    'animate-[roundedWave_5s_linear_infinite]',
    'animate-[roundedWave_8s_linear_infinite_-3000ms]',
    'animate-[roundedWave_6s_linear_infinite_-6000ms]',
    'animate-[roundedWave_7s_linear_infinite_-9000ms]',
  ];

  return (
    <div className="w-[90vw] h-[100vw] flex flex-row items-center justify-center overflow-hidden">
      <div
        className={`relative max-w-[500px] w-full transition-all ${isLoading ? 'duration-[5000ms]' : 'duration-100'}`}
        style={{
          transform: isLoading ? 'scale(0.5)' : `scale(${1.0 + myVolume * 1.5})`,
        }}
      >
        <img
          className="object-cover w-full opacity-0"
          width="100%"
          alt="transparent placeholder"
          src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
        />
        {isPlaying ? (
          <div
            key="container"
            className="absolute top-0 left-0 w-full h-full transition-all duration-500"
          >
            <div
              key="c-0"
              className={`absolute top-0 left-0 w-[25%] h-full p-2 transition-all duration-500`}
            >
              <div
                style={{ height: `${meterValue1 * 80 + 20}%` }}
                className="relative top-[50%] w-[95%] transition-all duration-[50ms] bg-white rounded-full translate-y-[-50%]"
              />
            </div>
            <div
              key="c-1"
              className={`absolute top-0 left-[25%] w-[25%] h-full p-2 transition-all duration-500`}
            >
              <div
                style={{ height: `${meterValue2 * 80 + 20}%` }}
                className="relative top-[50%] w-[95%] transition-all duration-[50ms] bg-white rounded-full translate-y-[-50%]"
              />
            </div>
            <div
              key="c-2"
              className={`absolute top-0 left-[50%] w-[25%] h-full p-2 transition-all duration-500`}
            >
              <div
                style={{ height: `${meterValue3 * 80 + 20}%` }}
                className="relative top-[50%] w-[95%] transition-all duration-[50ms] bg-white rounded-full translate-y-[-50%]"
              />
            </div>
            <div
              key="c-3"
              className={`absolute top-0 left-[75%] w-[25%] h-full p-2 transition-all duration-500`}
            >
              <div
                style={{ height: `${meterValue4 * 80 + 20}%` }}
                className="relative top-[50%] w-[95%] transition-all duration-[50ms] bg-white rounded-full translate-y-[-50%]"
              />
            </div>
          </div>
        ) : (
          <div
            key="container"
            className="absolute top-[50%] left-[50%] w-[50%] h-[50%] translate-x-[-50%] translate-y-[-50%] transition-all duration-500"
          >
            {
              // for circle shaped dom
              rbgColors.map((color, index) => {
                return (
                  <div
                    key={`c-${index}`}
                    className={`absolute top-0 left-0 w-full h-full ${spinAnimations[index]} mix-blend-screen transition-all duration-500`}
                  >
                    <div
                      className={`relative top-0 w-full h-full ${color} ${roundedAnimations[index]} transition-all duration-100`}
                    />
                  </div>
                );
              })
            }
          </div>
        )}
      </div>
    </div>
  );
};
