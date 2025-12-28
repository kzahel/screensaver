// Loads all screensavers dynamically, then loads options page dependencies sequentially
loadAllScreensavers().then(() => {
  // Load remaining dependencies in order (each depends on previous)
  const scripts = ['quotes.js', 'storage.js', 'options-generator.js', 'options.js'];

  function loadNext(index) {
    if (index >= scripts.length) return;

    const script = document.createElement('script');
    script.src = scripts[index];
    script.onload = () => loadNext(index + 1);
    document.head.appendChild(script);
  }

  loadNext(0);
});
