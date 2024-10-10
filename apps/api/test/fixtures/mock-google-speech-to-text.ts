export const MOCK_GOOGLE_SPEECH_TO_TEXT_RECOGNIZE_RESPONSE = {
  results: [
    {
      alternatives: [
        {
          words: [],
          transcript: 'how old is the Brooklyn Bridge',
          confidence: 0.9154219627380371,
        },
      ],
      channelTag: 0,
      resultEndTime: {
        seconds: '1',
        nanos: 770000000,
      },
      languageCode: 'en-us',
    },
  ],
  totalBilledTime: {
    seconds: '2',
    nanos: 0,
  },
  speechAdaptationInfo: null,
  requestId: '2391420958639879335',
};

export const MOCK_GOOGLE_SPEECH_TO_TEXT_RECOGNIZE_STREAM_RESPONSE = {
  results: [
    {
      alternatives: [
        {
          words: [],
          transcript: 'how old is the Brooklyn Bridge',
          confidence: 0.9799044728279114,
        },
      ],
      isFinal: true,
      stability: 0,
      resultEndTime: {
        seconds: '1',
        nanos: 740000000,
      },
      channelTag: 0,
      languageCode: 'en-us',
    },
  ],
  error: null,
  speechEventType: 'SPEECH_EVENT_UNSPECIFIED',
  totalBilledTime: {
    seconds: '2',
    nanos: 0,
  },
  speechEventTime: {
    seconds: '0',
    nanos: 0,
  },
  speechAdaptationInfo: null,
  requestId: '2627566453197020659',
};
