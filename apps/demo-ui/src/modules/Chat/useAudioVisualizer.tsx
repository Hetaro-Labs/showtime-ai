import * as React from 'react';

const isSupported = function () {
  return !!AudioContext;
};

export const useAudioVisualizer = (source?: MediaStream | null) => {
  const { analyser, dataArray } = React.useMemo(() => {
    if (!source) {
      return {
        context: null,
        analyser: null,
        dataArray: null,
      };
    }

    const context = new AudioContext();
    const audioSource = context.createMediaStreamSource(source);
    const analyser = context.createAnalyser();

    audioSource.connect(analyser);

    const binCount = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(binCount);

    return {
      analyser,
      dataArray,
    };
  }, [source]);

  const getSpectrum = React.useCallback(() => {
    if (!analyser || !dataArray) {
      return [];
    }

    if (!isSupported()) {
      throw new Error('AudioContext is not supported');
    }

    const spectrum = [];

    analyser.getByteFrequencyData(dataArray);

    for (var i = 0; i < dataArray.length; i++) {
      const dbValue = dataArray[i];

      spectrum.push(dbValue / 255);
    }

    return spectrum;
  }, [analyser, dataArray]);

  const getWaveform = React.useCallback(() => {
    if (!analyser || !dataArray) {
      return [];
    }

    if (!isSupported()) {
      throw new Error('AudioContext is not supported');
    }

    const waveform = [];

    analyser.getByteTimeDomainData(dataArray);

    for (var i = 0; i < dataArray.length; i++) {
      let value = dataArray[i];
      value = value - 128;
      value = value / 128;

      waveform.push(value);
    }

    return waveform;
  }, [analyser, dataArray]);

  const getVolume = React.useCallback(() => {
    if (!analyser || !dataArray) {
      return 0;
    }

    if (!isSupported()) {
      throw new Error('AudioContext is not supported');
    }

    const pcmData = new Float32Array(analyser.fftSize);

    analyser.getFloatTimeDomainData(pcmData);

    let sumSquares = 0.0;
    for (let i = 0; i < pcmData.length; i++) {
      sumSquares += pcmData[i] * pcmData[i];
    }
    const volume = Math.sqrt(sumSquares / pcmData.length);

    return volume;
  }, [analyser, dataArray]);

  return {
    getSpectrum,
    getWaveform,
    getVolume,
  };
};
