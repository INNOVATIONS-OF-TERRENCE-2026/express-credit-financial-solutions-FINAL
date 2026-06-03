import '@testing-library/jest-dom';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// jsdom doesn't implement canvas; provide a minimal stub so the
// signature canvas + jsPDF code paths don't blow up in tests.
(HTMLCanvasElement.prototype as any).getContext = function () {
  return {
    fillRect: () => {}, clearRect: () => {}, beginPath: () => {},
    moveTo: () => {}, lineTo: () => {}, stroke: () => {},
    fillText: () => {}, fillStyle: '', strokeStyle: '', lineWidth: 0, lineCap: '',
    font: '',
  };
};
(HTMLCanvasElement.prototype as any).toDataURL = () => 'data:image/png;base64,AAAA';