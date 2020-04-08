// ExtensionFrontEnd -- begin
var ExtensionFrontEnd = function () {
    this.injectedTabs = {};
    this.frequencyData = new Uint8Array(OV.fftSize);
    this.onPortMessage = this.onPortMessage.bind(this);
    this.onScriptsInjected = this.onScriptsInjected.bind(this);
    this.captureForButter = false;
};
(ExtensionFrontEnd.prototype.togglePauseContentScripts = function (tabId) {
    chrome.tabs.executeScript(tabId, { code: 'togglePause();' });
}),
    (ExtensionFrontEnd.prototype.pauseTab = function (tabId) {
        if (tabId in this.injectedTabs && this.injectedTabs[tabId].injected == true) {
            this.togglePauseContentScripts(tabId);
            this.injectedTabs[tabId].stream &&
                this.injectedTabs[tabId].stream.getTracks().forEach(function (track) {
                    track.stop();
                });
            this.closeContext(tabId);
            this.injectedTabs[tabId].isPaused = true;
        } else {
            console.log('trying to toggle pause on uninjected tab with id: ' + tabId);
        }
    }),
    (ExtensionFrontEnd.prototype.onScriptsInjected = function (tabId) {
        console.log('scripts injected to tab' + tabId);
        this.injectedTabs[tabId].injected = true;
        this.captureAudioFromTab(tabId);
    }),
    (ExtensionFrontEnd.prototype.captureAudioFromTab = function (tabId) {
        console.log('capturing audio from tab' + tabId);
        chrome.tabCapture.capture(
            { audio: true },
            function (stream) {
                this.initTab(stream, tabId);
            }.bind(this)
        );
    }),
    (ExtensionFrontEnd.prototype._MainClickedCallback = function (tabId) {
        if (wasError(`--initTab: ${tabId}`)) {
            return;
        }
        if (!(tabId in this.injectedTabs)) {
            this.injectedTabs[tabId] = new TabInfo();
        }

        if (this.injectedTabs[tabId].injected == false) {
            var scriptInjector = new ScriptInjector(tabId);
            var cssInjector = new ScriptInjector(tabId, true);
            scriptInjector.injectScripts(AV.scriptsToInject, this.onScriptsInjected);
            cssInjector.injectScripts(AV.stylesToInject, function () {});
        } else if (this.injectedTabs[tabId].isPaused === true) {
            this.captureAudioFromTab(tabId);
            this.injectedTabs[tabId].isPaused = false;
            this.togglePauseContentScripts(tabId);
        } else {
            this.pauseTab(tabId);
        }
    }),
    (ExtensionFrontEnd.prototype.MainClickedCallback = function (tab) {
        console.log('MainKey triggered on tabid: ' + tab.id);
        chrome.tabs.executeScript(
            tab.id,
            { code: jsInjectedQuery },
            function () {
                this._MainClickedCallback(tab.id);
            }.bind(this)
        );
    }),
    (ExtensionFrontEnd.prototype.initTab = function (stream, tabId) {
        if (!stream) wasError(`initTab: ${tabId}`);
        else this.initAudio(stream, tabId);
        this.connectToTab(tabId);
        console.log('init() on tabId:' + tabId);
        chrome.tabs.executeScript(tabId, { code: 'init();' });
    }),
    (ExtensionFrontEnd.prototype.messageHandler = function (req, sender, sendResponse) {
        if ('tab' in sender) {
            if (!(sender.tab.id in this.injectedTabs)) this.injectedTabs[sender.tab.id] = new TabInfo();
            if (req.loaded === false) this.injectedTabs[sender.tab.id].injected = false;
            else this.injectedTabs[sender.tab.id].injected = true;
            console.log(
                'got reply from tab with id: ' +
                    sender.tab.id +
                    ', injected status: ' +
                    this.injectedTabs[sender.tab.id].injected
            );
        }
    }),
    (ExtensionFrontEnd.prototype.updateHandler = function (tabId, changeinfo, tab) {
        if (!tab.url || tab.url.startsWith('chrome://')) return;
        chrome.tabs.executeScript(
            tabId,
            {
                code: jsInjectedQuery,
            },
            function () {
                wasError('updateHandler');
            }
        );
    }),
    (ExtensionFrontEnd.prototype.onPortMessage = function (msg, port) {
        switch (msg) {
            case AV.butterOn:
                this.captureForButter = true;
                this.reInitializeAllTabs();
                return;
            case AV.butterOff:
                this.captureForButter = false;
                this.reInitializeAllTabs();
                return;
            case AV.music:
                if (!this.captureForButter) {
                    this.injectedTabs[port.name].analyzer.getByteFrequencyData(this.frequencyData);
                    this.injectedTabs[port.name].port.postMessage(this.frequencyData);
                } else {
                    if (this.injectedTabs[port.name].audioProcessor) {
                        const obj = this.injectedTabs[port.name].audioProcessor.sampleAudio();
                        this.injectedTabs[port.name].port.postMessage(obj);
                    } else {
                        console.log('audioprocessor on ' + port.name + ' undefined');
                    }
                }
                return;
            case AV.openOptions:
                openOptions();
                return;
            case AV.setFullScreen:
                toggleScreenState('fullscreen');
                return;
            case AV.disableFullScreen:
                toggleScreenState();
                return;
            case AV.openSceneShare:
                openSceneShareWebSite();
                return;
        }
        if (msg[0] === AV.latencyHint) {
            storage.options.init(window.OV, this.reInitializeAllTabs.bind(this), true);
        }
    }),
    (ExtensionFrontEnd.prototype.reInitializeAllTabs = function () {
        var tabs = Object.keys(this.injectedTabs); //reinitialize on all tabs
        for (var i = 0; i < tabs.length; i++) {
            if (this.injectedTabs[tabs[i]].sourceNode && !this.injectedTabs[tabs[i]].isPaused) {
                this.initAudio(this.injectedTabs[tabs[i]].stream, tabs[i]);
            }
        }
    }),
    (ExtensionFrontEnd.prototype.closeContext = function (id) {
        return this.injectedTabs[id].context.close().then(
            function () {
                delete this.injectedTabs[id].context;
            }.bind(this)
        );
    });
(ExtensionFrontEnd.prototype.initAudio = function (stream, id) {
    if (!stream) {
        console.log(`tabid ${id} has no stream`);
        return;
    } else {
        console.log(`tabid ${id} has stream`);
    }
    if (this.injectedTabs[id].context) {
        if (this.injectedTabs[id].audioProcessor) {
            //this.injectedTabs[id].audioProcessor.disconnectAudio(this.injectedTabs[id].sourceNode);
            //causes exception sometimes, think diconnect below should handle it ?
        }
        this.injectedTabs[id].sourceNode.disconnect();
        this.closeContext(id).then(
            function () {
                this.initAudio(stream, id);
            }.bind(this)
        );
        return;
    }
    var audioCtxSettings = { latencyHint: OV.LatencyHint };
    this.injectedTabs[id].context = new AudioContext(audioCtxSettings);
    this.injectedTabs[id].sourceNode = this.injectedTabs[id].context.createMediaStreamSource(stream);

    if (!this.captureForButter) {
        this.injectedTabs[id].analyzer = this.injectedTabs[id].context.createAnalyser();
        this.injectedTabs[id].analyzer.fftSize = OV.fftSize;
        this.injectedTabs[id].sourceNode.connect(this.injectedTabs[id].analyzer);
        this.injectedTabs[id].sourceNode.connect(this.injectedTabs[id].context.destination);
        this.injectedTabs[id].stream = stream;
    } else {
        this.injectedTabs[id].audioProcessor = new ButterAudioProcessor(this.injectedTabs[id].context);
        this.injectedTabs[id].sourceNode.connect(this.injectedTabs[id].context.destination);
        this.injectedTabs[id].audioProcessor.connectAudio(this.injectedTabs[id].sourceNode);
    }
}),
    (ExtensionFrontEnd.prototype.connectToTab = function (id) {
        console.log('connecting 2 tab: ' + id);
        this.injectedTabs[id].port = chrome.tabs.connect(id, { name: id.toString() });
        this.injectedTabs[id].port.name = id;
        this.injectedTabs[id].port.onMessage.addListener(this.onPortMessage);
    }),
    // ExtensionFrontEnd -- end

    // ScriptInjector  -- begin
    (ScriptInjector = function (tabId, isCss) {
        this.tabId = tabId;
        this.scriptsLoadedCallback = null;
        this.scriptInjectCount = this.scriptInjectCount.bind(this);
        this.isCss = isCss;
    });
(ScriptInjector.prototype.injectScripts = function (scripts, callback) {
    this.scriptsLoadedCallback = callback;
    this.scripts = scripts;
    this.scriptsLoaded = 0;
    if (this.isCss) {
        for (var script of scripts) chrome.tabs.insertCSS(this.tabId, { file: script }, this.scriptInjectCount);
    } else {
        for (var script of scripts) chrome.tabs.executeScript(this.tabId, { file: script }, this.scriptInjectCount);
    }
}),
    (ScriptInjector.prototype.scriptInjectCount = function () {
        if (++this.scriptsLoaded == this.scripts.length) {
            this.scriptsLoadedCallback(this.tabId);
        }
    }),
    // ScriptInjector  -- end

    // TabInfo - date struct class
    (TabInfo = function () {
        this.port = null;
        this.id = null;
        this.injected = false;
        this.isPaused = false;
        this.analyzer = null;
    }),
    // errorHandling
    (wasError = function (id) {
        return chrome.runtime.lastError
            ? console.log('error from id: ' + id + '\n' + 'message: ' + chrome.runtime.lastError.message) || true
            : false;
    }),
    (openSceneShareWebSite = function (q) {
        chrome.tabs.create({
            url: 'http://audiovisualizer.net/',
        });
    }),
    (jsInjectedQuery =
        'chrome.extension.sendMessage({ loaded: window.ChromeAudioVisualizerExtensionHasBeenInjected === true});');
