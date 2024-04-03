export function setupCounter(element: HTMLButtonElement) {
  let counter = 0;
  const setCounter = (count: number) => {
    counter = count;
    element.innerHTML = `count is ${counter}`;
    chrome.runtime.sendMessage({
      action: 'update-audio-data',
      target: 'service-worker',
      data: "count is ",
    });
  };
  element.addEventListener('click', () => setCounter(counter + 1));
  setCounter(0);
}
