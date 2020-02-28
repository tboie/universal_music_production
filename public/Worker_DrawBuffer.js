self.onmessage = function( e ){
  summarizeFaster(e.data.buffer, e.data.width)
}

function summarizeFaster(data, pixels) {
  let pixelLength = Math.round(data.length / pixels);
  let vals = [];

  // Define a minimum sample size per pixel
  let maxSampleSize = 1000;
  let sampleSize = Math.min(pixelLength, maxSampleSize);

  // For each pixel we display
  for (let i = 0; i < pixels; i++) {
    let posSum = 0,
      negSum = 0;

    // Cycle through the data-points relevant to the pixel
    // Don't cycle through more than sampleSize frames per pixel.
    for (let j = 0; j < sampleSize; j++) {
      let val = data[i * pixelLength + j];

      // Keep track of positive and negative values separately
      if (val > 0) {
        posSum += val;
      } else {
        negSum += val;
      }
    }
    vals.push([negSum / sampleSize, posSum / sampleSize]);
  }
  
  self.postMessage(vals)
}