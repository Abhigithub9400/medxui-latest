class PCMProcessor extends AudioWorkletProcessor {
  
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || input.length === 0) return Boolean(true);

    const pcm = new Int16Array(input[0].length);
    for (let i = 0; i < input[0].length; i++) {
      const sample = Math.max(-1, Math.min(1, input[0][i]));
      pcm[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    }

    this.port.postMessage(pcm.buffer, [pcm.buffer]);
    return Boolean(pcm);
  }
}

registerProcessor('pcm-processor', PCMProcessor);


