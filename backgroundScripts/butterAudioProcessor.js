var ButterAudioProcessor = function(context)
{
    this.numSamps = 512;
    this.audioContext = context;
    this.audible = context.createDelay();

    this.analyser = context.createAnalyser();
    this.analyser.smoothingTimeConstant = 0.0;
    this.analyser.fftSize = this.numSamps * 2;

    this.audible.connect(this.analyser);

    // Split channels
    this.analyserL = context.createAnalyser();
    this.analyserL.smoothingTimeConstant = 0.0;
    this.analyserL.fftSize = this.numSamps * 2;

    this.analyserR = context.createAnalyser();
    this.analyserR.smoothingTimeConstant = 0.0;
    this.analyserR.fftSize = this.numSamps * 2;

    this.splitter = context.createChannelSplitter(2);

    this.audible.connect(this.splitter);
    this.splitter.connect(this.analyserL, 0);
    this.splitter.connect(this.analyserR, 1);
};

ButterAudioProcessor.prototype.sampleAudio = function() {
    const timeByteArray = new Uint8Array(this.numSamps);
    const timeByteArrayL = new Uint8Array(this.numSamps);
    const timeByteArrayR = new Uint8Array(this.numSamps);
    this.analyser.getByteTimeDomainData(timeByteArray);
    this.analyserL.getByteTimeDomainData(timeByteArrayL);
    this.analyserR.getByteTimeDomainData(timeByteArrayR);

    return {timeByteArray, timeByteArrayL, timeByteArrayR};
}
ButterAudioProcessor.prototype.connectAudio = function(audionode) {
    audionode.connect(this.audible);
}

ButterAudioProcessor.prototype.disconnectAudio = function(audionode) {
    audionode.disconnect(this.audible);
}