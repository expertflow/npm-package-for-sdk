var iceServers;
var Channel;
var ws_value;
var wss_server_ip;
var wss_server_port;
var dialling_uri;
var sip_extension;
var extension_password;
var IP;
var wss_port;
var dialerURI;
var SIP_Password;
var enable_logs;
var chat_webhook;

var session;
var mediaElement;
var mediaLocal;
var userAgent;
var ext;
var register = false;
let displayMediaStream;
var toggleVideo;
var video;
var audio;
var screen;
var mediaAcquire = 'end';
var endCallBtn = false;
var JsSIP;
let socket = {};
const get_dynamic_ext = () => new Promise((resolve, reject) => {
    resolve(sip_extension);
});
// /* Function to Include js files in the customer application*/
// function include(file) {
//     var script = document.createElement('script');
//     script.src = file;
//     script.type = 'text/javascript';
//     script.defer = true;
//     document.getElementsByTagName('head').item(0).appendChild(script);
// }
const loadLibrary = async () => {
    JsSIP = await import('react-native-jssip');
    // Do something with SomeLibrary
};
/**
 * Widget Configurations Fetching Function
 * @param {*} ccmUrl
 * @param {*} widgetIdentifier
 * @param {*} callback
 */
function widgetConfigs(ccmUrl, widgetIdentifier, callback) {
    // fetch(`${ccmUrl}/widget-configs/${widgetIdentifier}`)
    fetch(`${ccmUrl}/widget-configs`)
        .then(response => response.json())
        .then((data) => {
            callback(data);
            wss_server_ip = data.webRTC.wss_server_ip;
            wss_server_port = data.webRTC.wss_server_port;
            dialling_uri = data.webRTC.dialling_uri;
            sip_extension = data.webRTC.sip_extension;
            extension_password = data.webRTC.extension_password;
            enable_sip_logs = data.webRTC.enabledSipLogs;
            iceServers = data.webRTC.iceServers;
            Channel = data.webRTC.channel;
            ws_value = data.webRTC.websocket;

            enable_logs = enable_sip_logs;
            IP = wss_server_ip;
            wss_port = wss_server_port;
            dialerURI = 'sip:' + dialling_uri + '@' + wss_server_ip;
            SIP_Password = extension_password;

            chat_webhook = data.webhook_url;
            if (Channel == 'mobile') {
                loadLibrary();
            } else {
                /* Include js files */
                //include('https://cdn.socket.io/4.5.4/socket.io.min.js');
                //include('https://cdnjs.cloudflare.com/ajax/libs/sip.js/0.15.11/sip-0.15.11.min.js');
            }
        });
}
/**
 * Function to Establish Connection
 * Two Parameters
 * 1- Customer Data
 * 2- Call Function of socketEventListeners()
 * @param {*} serviceIdentifier
 * @param {*} channelCustomerIdentifier
 * @param {*} callback
 */
function establishConnection(serviceIdentifier, channelCustomerIdentifier, callback) {
    try {
        if (this.socket === undefined || !this.socket.connected) {
            if (socket_url !== '') {
                let origin = new URL(socket_url).origin;
                let path = new URL(socket_url).pathname;
                this.socket = io(origin, {
                    path: path == '/' ? '' : path + '/socket.io',
                    auth: {
                        serviceIdentifier: serviceIdentifier,
                        channelCustomerIdentifier: channelCustomerIdentifier
                    }
                });
                eventListeners((data) => {
                    callback(data);
                });
            }
        }
    } catch (error) {
        callback(error);
    }
}
/**
 *  Socket EventListener Function
 *  1- Socket Connection Event
 *  2- Socket Discount Event
 *  3- Socket Connection Error Event
 *  4- Socket Message Arrived Event
 *  5- Socket End Conversation Event
 *  6- Socket Error
 *  7- Channel Session Started Event
 *  @param {*} callback
 */
function eventListeners(callback) {
    this.socket.on('connect', () => {
        if (this.socket.id != undefined) {
            console.log(`you are connected with socket:`, this.socket);
            callback({ type: "SOCKET_CONNECTED", data: this.socket });
        }
    });
    this.socket.on('CHANNEL_SESSION_STARTED', (data) => {
        console.log(`Channel Session Started Data: `, data);
        callback({ type: "CHANNEL_SESSION_STARTED", data: data });
    });
    this.socket.on('MESSAGE_RECEIVED', (message) => {
        console.log(`MESSAGE_RECEIVED received: `, message);
        callback({ type: "MESSAGE_RECEIVED", data: message });
    });
    this.socket.on('disconnect', (reason) => {
        console.error(`Connection lost with the server: `, reason);
        callback({ type: "SOCKET_DISCONNECTED", data: reason });
    });
    this.socket.on('connect_error', (error) => {
        console.log(`unable to establish connection with the server: `, error);
        callback({ type: "CONNECT_ERROR", data: error });
    });
    this.socket.on('CHAT_ENDED', (data) => {
        console.log(`CHAT_ENDED received: `, data);
        callback({ type: "CHAT_ENDED", data: data });
        this.socket.disconnect();
    });
    this.socket.on('ERRORS', (data) => {
        console.error(`ERRORS received: `, data);
        callback({ type: "ERRORS", data: data });
    });
}
/**
 * Chat Request Function with customer data
 * @param {*} data
 */
function chatRequest(data) {
    try {
        if (data) {
            let additionalAttributesData = [];
            let webChannelDataObj = {
                key: 'WebChannelData',
                type: 'WebChannelData',
                value: {
                    browserDeviceInfo: data.data.browserDeviceInfo,
                    queue: data.data.queue,
                    locale: data.data.locale,
                    formData: data.data.formData
                }
            };
            additionalAttributesData.push(webChannelDataObj);
            let obj = {
                channelCustomerIdentifier: data.data.channelCustomerIdentifier,
                serviceIdentifier: data.data.serviceIdentifier,
                additionalAttributes: additionalAttributesData
            };
            webhookNotifications(data.data.formData);
            this.socket.emit('CHAT_REQUESTED', obj);
            console.log(`SEND CHAT_REQUESTED DATA:`, obj);
        }
    } catch (error) {
        throw error;
    }
}
/**
 * Send Message Socket Event with Message Payload in parameter
 * @param {*} data
 */
function sendMessage(data) {
    data.timestamp = '';
    this.socket.emit('MESSAGE_RECEIVED', data, (res) => {
        console.log('[sendMessage] ', res);
        if (res.code !== 200) {
            console.log("message not sent");
        }
    })
}
/**
 * End Chat Socket Event with Customer Data in the parameter
 * @param {*} data
 */
function chatEnd(data) {
    // Chat Disconnection Socket Event
    this.socket.emit('CHAT_ENDED', data);
}
/**
 * File Upload to File Engine Function
 * @param {*} formData
 * @param {*} callback
 */
function uploadToFileEngine(formData, callback) {
    fetch(`${file_server_url}/api/uploadFileStream`, {
        method: 'POST',
        body: formData
    })
        .then((response) => response.json())
        .then((result) => {
            console.log('Success: ', result);
            callback(result);
        })
        .catch((error) => {
            console.error('Error: ', error);
            callback(error);
        });
}
/**
 * Webhook Notifications Functions
 * @param {*} data
 */
function webhookNotifications(data) {
    let notifications = {};
    notifications['text'] = `Name: ${data.attributes[0].value} ${data.attributes[1].value} Email: ${data.attributes[2].value} started a chat`
    fetch(`${chat_webhook}`, {
        method: 'POST',
        body: JSON.stringify(notifications),
        headers: {
            "Content-Type": "application/json; charset=UTF-8"
        }
    })
        .then((response) => response.json())
        .then((result) => {
            console.log('Success: ', result);
            // callback(result);
        })
        .catch((error) => {
            console.error('Error: ', error);
            // callback(error);
        });
}
function endCall(eventCallback) {
    if (session === true) {
        closeSession(eventCallback);
        clearInterval(counterVar);
    } else {
        toggleFab();
        hideChat(0);
    }
}
function dialCall(eventCallback) {
    console.log('function called.')
    get_dynamic_ext().then((extension) => {
        // Create a user agent named extension, connect, and register to receive invitations.
        ext = extension;
        if (Channel == "web") {
            userAgent = new SIP.UA({
                uri: extension + '@' + IP,
                transportOptions: { wsServers: ws_value + '://' + IP + ':' + wss_port, traceSip: true },
                authorizationUser: extension,
                password: SIP_Password,
                log: {
                    builtinEnabled: enable_logs,
                    level: 3 // log log level
                },
                register: true
            });
        }
        if (Channel == "mobile") {
            socket = new JsSIP.WebSocketInterface(ws_value + '://' + IP + ':' + wss_port);
            var configuration = {
                sockets: [socket],
                uri: 'sip:' + extension + '@' + IP,
                password: SIP_Password,
                display_name: extension,
                register_expires: 4500,
                session_timers: false,
                register: true
            }
            userAgent = new JsSIP.UA(configuration);

        }
        // Connect the user agent
        userAgent.start();
        if (typeof eventCallback === "function") {
            let event = {
                event: 'get_dynamic_ext',
                response: extension,
                cause: ''
            };
            eventCallback(event);
        }

        userAgent.on('newRTCSession', function (e) {
            console.log("New Webrtc session created!");
        });

        userAgent.on('unregistered', function (response, cause) {
            register = false;
            if (typeof eventCallback === "function") {
                let event = {
                    event: 'unregistered',
                    response: response,
                    cause: cause
                };
                eventCallback(event);
            }

        });

        userAgent.on('registered', function () {
            register = true;
            if (typeof eventCallback === "function") {
                let event = {
                    event: 'registered',
                    response: '',
                    cause: ''
                };
                eventCallback(event);
            }
        });


        userAgent.on('registrationFailed', function (response, cause) {
            if (typeof eventCallback === "function") {
                let event = {
                    event: 'registrationFailed',
                    response: response,
                    cause: cause
                };
                eventCallback(event);
            }
        });
    })
        .catch((rej) => {
            if (typeof eventCallback === "function") {
                let event = {
                    event: 'get_dynamic_ext',
                    response: '',
                    cause: rej
                };
                eventCallback(event);
            }
        });

}
const sendInvite = (mediaType, videoName, videoLocal, userData, eventCallback) => {
    return new Promise((resolve, reject) => {
        // "Producing Code" (May take some time)
        if (Channel == "web") {
            var mediaConstraints = { audio: true, video: true };
            toggleVideo = 'web_cam';
            mediaElement = document.getElementById(videoName);
            if (videoLocal === '') {
                mediaLocal = '';
            } else {
                mediaLocal = document.getElementById(videoLocal);
            }
            audio = 'true';
            if (mediaType === 'audio') {
                mediaConstraints = { audio: true, video: false };
                // mediaElement = document.getElementById('remoteAudio');
                video = 'false';
            } else {
                // mediaConstraints= { audio: true, video: true, screen:true};
                mediaConstraints = { audio: true, video: true };
                // mediaElement = document.getElementById('remoteVideo');
                video = 'true';
            }
            screen = 'false';

            console.log("invite function has been triggered");
            if (userData !== null) {
                var extraHeaderString = []
                var index = 0
                for (const key in userData) {
                    // var keyValue = encodeURIComponent(userData[key].trim())
                    var keyValue = userData[key].trim();
                    extraHeaderString.push('X-variable' + index + ":" + key + "|" + keyValue);
                    index++;
                }
                // console.error(extraHeaderString);
            }
            session = userAgent.invite(dialerURI, {
                sessionDescriptionHandlerOptions: {
                    constraints: mediaConstraints
                }
                , extraHeaders: extraHeaderString
            });
        }
        if (Channel == "mobile") {
            var videoValue = false;
            if (videoLocal !== '') videoValue = true;
            if (userData !== null) {
                var extraHeaderString = []
                var index = 0
                for (const key in userData) {
                    // var keyValue = encodeURIComponent(userData[key].trim())
                    var keyValue = userData[key].trim();
                    extraHeaderString.push('X-variable' + index + ":" + key + "|" + keyValue);
                    index++;
                }
                // console.error(extraHeaderString);
            }
            var options = {
                //'eventHandlers'    : eventHandlers,
                'mediaConstraints': { 'audio': true, 'video': videoValue },
                extraHeaders: extraHeaderString,
                'sessionTimersExpires': 1020,
                'pcConfig': {
                    'iceServers': iceServers
                }
            };

            session = userAgent.call(dialerURI, options);
        }
        if (typeof eventCallback === "function") {
            let event = {
                event: 'Channel Creating',
                response: '',
                cause: ''
            };
            eventCallback(event);
        }

        // session.on('userMedia', async (stream)=> {
        //     stream.replaceTrack(displayMediaStream.getTracks()[0]);

        // });
        session.on('accepted', function () {
            // Assumes you have a media element on the DOM
            if (Channel == "web") {
                const remoteStream = new MediaStream();
                if (video === 'false') {
                    console.log("closing video")
                    // closeVideo();	
                }
                session.sessionDescriptionHandler.peerConnection.getReceivers().forEach((receiver) => {
                    if (receiver.track) {
                        remoteStream.addTrack(receiver.track);
                    }
                });
                mediaElement.srcObject = remoteStream;
                if (mediaLocal !== '') {
                    const localStream = new MediaStream();
                    session.sessionDescriptionHandler.peerConnection.getSenders().forEach((sender) => {
                        if (sender.track.kind === "video") {
                            localStream.addTrack(sender.track);
                        }
                    });
                    mediaLocal.srcObject = localStream;
                }
            }
            if (typeof eventCallback === "function") {
                let event = {
                    event: 'session-accepted',
                    response: '',
                    cause: ''
                };
                eventCallback(event);
            }
        })
        session.on('progress', function (response) {
            if (typeof eventCallback === "function") {
                let event = {
                    event: 'session-progress',
                    response: response,
                    cause: ''
                };
                eventCallback(event);
            }
        })
        session.on('rejected', function (response, cause) {
            console.log('rejected');
            if (typeof eventCallback === "function") {
                let event = {
                    event: 'session-rejected',
                    response: response,
                    cause: cause
                };
                eventCallback(event);
            }
        })

        session.on('failed', function (response, cause) {
            console.log('failed');
            if (typeof eventCallback === "function") {
                let event = {
                    event: 'session-failed',
                    response: response,
                    cause: cause
                };
                eventCallback(event);
            }
            var options = {
                'all': true
            };

            userAgent.unregister(options);
        })
        session.on('ended', function (response, cause) {
            console.log('failed');
            if (typeof eventCallback === "function") {
                let event = {
                    event: 'session-ended',
                    response: response,
                    cause: cause
                };
                eventCallback(event);
            }
        })
        session.on('terminated', function (message, cause) {
            console.log('terminated');
            closeSession();
            console.log('after calling closeSession');
            if (typeof eventCallback === "function") {
                let event = {
                    event: 'session-terminated',
                    response: message,
                    cause: cause
                };
                eventCallback(event);
            }
        })
        session.on('bye', function (request) {
            console.log('bye');
            if (typeof eventCallback === "function") {
                let event = {
                    event: 'session-bye',
                    response: request,
                    cause: ''
                };
                eventCallback(event);
            }
        })
        session.on('iceConnectionDisconnected', function () {
            console.log('iceConnectionDisconnected');
            if (typeof eventCallback === "function") {
                let event = {
                    event: 'session-iceConnectionDisconnected',
                    response: 'request',
                    cause: ''
                };
                eventCallback(event);
            }
        })
        session.on('SessionDescriptionHandler-created', function () {
            session.sessionDescriptionHandler.on('getDescription', function (sdpWrapper) {
                if (typeof eventCallback === "function") {
                    let event = {
                        event: 'session-SessionDescriptionHandler-getDescription',
                        response: sdpWrapper,
                        cause: ''
                    };
                    eventCallback(event);
                }
            })
            session.sessionDescriptionHandler.on('Media acquire start', function () {
                mediaAcquire = 'start';
                if (typeof eventCallback === "function") {
                    let event = {
                        event: 'session-SessionDescriptionHandler-Media acquire start',
                        response: '',
                        cause: ''
                    };
                    eventCallback(event);
                }
            })
            session.sessionDescriptionHandler.on('Media acquire end', function () {
                if (endCallBtn === true) {
                    // mediaAcquire = 'end';
                    terminateCurrentSession();
                    endCallBtn = false;
                }
                mediaAcquire = 'end';
                if (typeof eventCallback === "function") {
                    let event = {
                        event: 'session-SessionDescriptionHandler-Media acquire end',
                        response: '',
                        cause: ''
                    };
                    eventCallback(event);
                }
            })
            if (typeof eventCallback === "function") {
                let event = {
                    event: 'session-SessionDescriptionHandler-created',
                    response: '',
                    cause: ''
                };
                eventCallback(event);
            }
        });
        resolve("successfull");

    });
}
function closeVideo() {
    let pc = this.session.sessionDescriptionHandler.peerConnection;
    pc.getSenders().find(function (s) {
        if (s.track.readyState == 'live' && s.track.kind === 'video') {
            s.track.stop();
        }
    });
}
function terminateCurrentSession(eventCallback) {
    promise1.then((value) => {
        userAgent.stop();
        console.log("session-userAgent.stop()");
    }).then(function (results) {
        userAgent.transport.disconnect();
        console.log("session-userAgent.transport.disconnect()");
    }).then(function (results) {
        var options = {
            'all': true
        };
        userAgent.unregister(options);
        console.log("session-userAgent.unregister()");
    }).then(function (results) {
        console.log('session-session_ended');
        if (typeof eventCallback === "function") {
            let event = {
                event: 'session-session_ended',
                response: 'userAgent unregistered',
                cause: ''
            };
            eventCallback(event);
        }
    });
}
const promise1 = new Promise((resolve, reject) => {
    resolve('Success!');
});
function closeSession(eventCallback) {
    if (mediaAcquire === 'start') {
        endCallBtn = true;
    } else {
        terminateCurrentSession(eventCallback);
    }
}
function audioControl() {
    let pc = session.sessionDescriptionHandler.peerConnection;
    if (audio === 'true') {
        pc.getSenders().find(function (s) {
            console.log(s.track.kind + "--------------" + s.track.readyState);
            if (s.track.readyState == 'live' && s.track.kind === 'audio') {
                s.track.stop();
            }
        });

        audio = 'false';
    } else {
        navigator.mediaDevices
            .getUserMedia({
                audio: true
            })
            .then(function (stream) {
                let audioTrack = stream.getAudioTracks()[0];
                var sender = pc.getSenders().find(function (s) {

                    return s.track.kind == audioTrack.kind;
                });
                console.log('found sender:', sender);
                sender.replaceTrack(audioTrack);
            })
            .catch(function (err) {
                console.error('Error happens:', err);
            });

        audio = 'true';
    }

}
function videoControl() {
    let pc = session.sessionDescriptionHandler.peerConnection;
    if (video === 'true') {
        pc.getSenders().find(function (s) {
            console.log(s.track.kind + "--------------" + s.track.readyState);
            if (s.track.readyState == 'live' && s.track.kind === 'video') {
                s.track.stop();
            }
        });
        video = 'false';
    } else {
        navigator.mediaDevices
            .getUserMedia({
                video: true
            })
            .then(function (stream) {
                let videoTrack = stream.getVideoTracks()[0];
                var sender = pc.getSenders().find(function (s) {
                    return s.track.kind == videoTrack.kind;
                });
                console.log('found sender:', sender);
                sender.replaceTrack(videoTrack);
                mediaLocal.srcObject = stream;
                mediaLocal.play();

            })
            .catch(function (err) {
                console.error('Error happens:', err);
            });

        video = 'true';
    }

}
function screenControl() {
    if (screen === 'false') {
        screen = 'true';
    } else {
    }
}

window.dialCall = dialCall;
window.sendInvite = sendInvite;
window.closeSession = closeSession;
window.videoControl = videoControl;
window.audioControl = audioControl;
window.screenControl = screenControl;

module.exports = {
    widgetConfigs,
    establishConnection,
    chatRequest,
    sendMessage,
    uploadToFileEngine,
    chatEnd,
    dialCall,
    sendInvite,
    audioControl,
    videoControl,
    closeSession,
    terminateCurrentSession,
    endCall,
    screenControl
}