import type * as GoogleVertexAI from '@google-cloud/vertexai';

export const MOCK_GREETING_RESPONSE = {
  finishReason: 'STOP',
  response: {
    type: 'text',
    text: 'Hello, thank you for asking. I am doing well. How are you? If you would like to discuss anything specific or if you have any questions for me, please feel free to ask.',
  },
} as GoogleVertexAI.GenerateContentResult;

export const MOCK_GREETING_STREAM_RESPONSE = [
  {
    candidates: [
      {
        content: {
          role: 'model',
          parts: [
            {
              text: 'Hello,',
            },
          ],
        },
        index: 0,
      },
    ],
  },
  {
    candidates: [
      {
        content: {
          role: 'model',
          parts: [
            {
              text: ' I am doing well, thank you for asking.\n\nHow are you doing today?',
            },
          ],
        },
        safetyRatings: [
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.06776495,
            severity: 'HARM_SEVERITY_NEGLIGIBLE',
            severityScore: 0.058182083,
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.0708775,
            severity: 'HARM_SEVERITY_NEGLIGIBLE',
            severityScore: 0.009101127,
          },
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.23112823,
            severity: 'HARM_SEVERITY_NEGLIGIBLE',
            severityScore: 0.05615625,
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.10938976,
            severity: 'HARM_SEVERITY_NEGLIGIBLE',
            severityScore: 0.056494635,
          },
        ],
        index: 0,
      },
    ],
  },
  {
    candidates: [
      {
        groundingMetadata: {
          webSearchQueries: ['how are you'],
          searchEntryPoint: {
            renderedContent:
              '<style>\n.container {\n  align-items: center;\n  border-radius: 8px;\n  display: flex;\n  font-family: Google Sans, Roboto, sans-serif;\n  font-size: 14px;\n  line-height: 20px;\n  padding: 8px 12px;\n}\n.chip {\n  display: inline-block;\n  border: solid 1px;\n  border-radius: 16px;\n  min-width: 14px;\n  padding: 5px 16px;\n  text-align: center;\n  user-select: none;\n  margin: 0 8px;\n  -webkit-tap-highlight-color: transparent;\n}\n.carousel {\n  overflow: auto;\n  scrollbar-width: none;\n  white-space: nowrap;\n  margin-right: -12px;\n}\n.headline {\n  display: flex;\n  margin-right: 4px;\n}\n.gradient-container {\n  position: relative;\n}\n.gradient {\n  position: absolute;\n  transform: translate(3px, -9px);\n  height: 36px;\n  width: 9px;\n}\n@media (prefers-color-scheme: light) {\n  .container {\n    background-color: #fafafa;\n    box-shadow: 0 0 0 1px #0000000f;\n  }\n  .headline-label {\n    color: #1f1f1f;\n  }\n  .chip {\n    background-color: #ffffff;\n    border-color: #d2d2d2;\n    color: #5e5e5e;\n    text-decoration: none;\n  }\n  .chip:hover {\n    background-color: #f2f2f2;\n  }\n  .chip:focus {\n    background-color: #f2f2f2;\n  }\n  .chip:active {\n    background-color: #d8d8d8;\n    border-color: #b6b6b6;\n  }\n  .logo-dark {\n    display: none;\n  }\n  .gradient {\n    background: linear-gradient(90deg, #fafafa 15%, #fafafa00 100%);\n  }\n}\n@media (prefers-color-scheme: dark) {\n  .container {\n    background-color: #1f1f1f;\n    box-shadow: 0 0 0 1px #ffffff26;\n  }\n  .headline-label {\n    color: #fff;\n  }\n  .chip {\n    background-color: #2c2c2c;\n    border-color: #3c4043;\n    color: #fff;\n    text-decoration: none;\n  }\n  .chip:hover {\n    background-color: #353536;\n  }\n  .chip:focus {\n    background-color: #353536;\n  }\n  .chip:active {\n    background-color: #464849;\n    border-color: #53575b;\n  }\n  .logo-light {\n    display: none;\n  }\n  .gradient {\n    background: linear-gradient(90deg, #1f1f1f 15%, #1f1f1f00 100%);\n  }\n}\n</style>\n<div class="container">\n  <div class="headline">\n    <svg class="logo-light" width="18" height="18" viewBox="9 9 35 35" fill="none" xmlns="http://www.w3.org/2000/svg">\n      <path fill-rule="evenodd" clip-rule="evenodd" d="M42.8622 27.0064C42.8622 25.7839 42.7525 24.6084 42.5487 23.4799H26.3109V30.1568H35.5897C35.1821 32.3041 33.9596 34.1222 32.1258 35.3448V39.6864H37.7213C40.9814 36.677 42.8622 32.2571 42.8622 27.0064V27.0064Z" fill="#4285F4"/>\n      <path fill-rule="evenodd" clip-rule="evenodd" d="M26.3109 43.8555C30.9659 43.8555 34.8687 42.3195 37.7213 39.6863L32.1258 35.3447C30.5898 36.3792 28.6306 37.0061 26.3109 37.0061C21.8282 37.0061 18.0195 33.9811 16.6559 29.906H10.9194V34.3573C13.7563 39.9841 19.5712 43.8555 26.3109 43.8555V43.8555Z" fill="#34A853"/>\n      <path fill-rule="evenodd" clip-rule="evenodd" d="M16.6559 29.8904C16.3111 28.8559 16.1074 27.7588 16.1074 26.6146C16.1074 25.4704 16.3111 24.3733 16.6559 23.3388V18.8875H10.9194C9.74388 21.2072 9.06992 23.8247 9.06992 26.6146C9.06992 29.4045 9.74388 32.022 10.9194 34.3417L15.3864 30.8621L16.6559 29.8904V29.8904Z" fill="#FBBC05"/>\n      <path fill-rule="evenodd" clip-rule="evenodd" d="M26.3109 16.2386C28.85 16.2386 31.107 17.1164 32.9095 18.8091L37.8466 13.8719C34.853 11.082 30.9659 9.3736 26.3109 9.3736C19.5712 9.3736 13.7563 13.245 10.9194 18.8875L16.6559 23.3388C18.0195 19.2636 21.8282 16.2386 26.3109 16.2386V16.2386Z" fill="#EA4335"/>\n    </svg>\n    <svg class="logo-dark" width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">\n      <circle cx="24" cy="23" fill="#FFF" r="22"/>\n      <path d="M33.76 34.26c2.75-2.56 4.49-6.37 4.49-11.26 0-.89-.08-1.84-.29-3H24.01v5.99h8.03c-.4 2.02-1.5 3.56-3.07 4.56v.75l3.91 2.97h.88z" fill="#4285F4"/>\n      <path d="M15.58 25.77A8.845 8.845 0 0 0 24 31.86c1.92 0 3.62-.46 4.97-1.31l4.79 3.71C31.14 36.7 27.65 38 24 38c-5.93 0-11.01-3.4-13.45-8.36l.17-1.01 4.06-2.85h.8z" fill="#34A853"/>\n      <path d="M15.59 20.21a8.864 8.864 0 0 0 0 5.58l-5.03 3.86c-.98-2-1.53-4.25-1.53-6.64 0-2.39.55-4.64 1.53-6.64l1-.22 3.81 2.98.22 1.08z" fill="#FBBC05"/>\n      <path d="M24 14.14c2.11 0 4.02.75 5.52 1.98l4.36-4.36C31.22 9.43 27.81 8 24 8c-5.93 0-11.01 3.4-13.45 8.36l5.03 3.85A8.86 8.86 0 0 1 24 14.14z" fill="#EA4335"/>\n    </svg>\n    <div class="gradient-container"><div class="gradient"></div></div>\n  </div>\n  <div class="carousel">\n    <a class="chip" href="https://www.google.com/search?q=how+are+you&client=app-vertex-grounding&safesearch=active">how are you</a>\n  </div>\n</div>\n',
          },
        },
        index: 0,
        content: {
          role: 'model',
        },
      },
    ],
  },
  {
    usageMetadata: {
      promptTokenCount: 6,
      candidatesTokenCount: 19,
      totalTokenCount: 25,
    },
  },
];

export const MOCK_FUNCTION_CALL_RESPONSE = {
  response: {
    candidates: [
      {
        content: {
          role: 'model',
          parts: [
            {
              functionCall: {
                name: 'get_current_weather',
                args: {
                  location: 'New York',
                },
              },
            },
          ],
        },
        finishReason: 'STOP',
        safetyRatings: [
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.0970919,
            severity: 'HARM_SEVERITY_NEGLIGIBLE',
            severityScore: 0.07759912,
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.12857448,
            severity: 'HARM_SEVERITY_LOW',
            severityScore: 0.21291144,
          },
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.13062036,
            severity: 'HARM_SEVERITY_NEGLIGIBLE',
            severityScore: 0.08122466,
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.029068176,
            severity: 'HARM_SEVERITY_NEGLIGIBLE',
            severityScore: 0.053635214,
          },
        ],
        index: 0,
      },
    ],
    usageMetadata: {
      promptTokenCount: 22,
      candidatesTokenCount: 8,
      totalTokenCount: 30,
    },
  },
};

export const MOCK_FUNCTION_CALL_STREAM_RESPONSE = [
  {
    candidates: [
      {
        content: {
          role: 'model',
          parts: [
            {
              functionCall: {
                name: 'get_current_weather',
                args: {
                  location: 'New York',
                },
              },
            },
          ],
        },
        safetyRatings: [
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.0970919,
            severity: 'HARM_SEVERITY_NEGLIGIBLE',
            severityScore: 0.07759912,
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.12857448,
            severity: 'HARM_SEVERITY_LOW',
            severityScore: 0.21291144,
          },
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.13062036,
            severity: 'HARM_SEVERITY_NEGLIGIBLE',
            severityScore: 0.08122466,
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.029068176,
            severity: 'HARM_SEVERITY_NEGLIGIBLE',
            severityScore: 0.053635214,
          },
        ],
        index: 0,
      },
    ],
  },
  {
    candidates: [
      {
        content: {
          role: 'model',
          parts: [
            {
              text: '',
            },
          ],
        },
        finishReason: 'STOP',
        index: 0,
      },
    ],
    usageMetadata: {
      promptTokenCount: 22,
      candidatesTokenCount: 8,
      totalTokenCount: 30,
    },
  },
];
