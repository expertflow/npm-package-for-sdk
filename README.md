# SDK for Customer Facing Channels
 This SDK is used for embedding customer-facing channel capabilities in a mobile-app (native, hybrid) or a web-app. Developers can use their own user interface on a Web or any Native-App. Learn more about the products we build at [Expertflow CX](https://docs.expertflow.com)
 
 ## SDK Capabilities
 With this SDK, the developer can enable the customer to:
 
 * Start and End Chat.
 * Make an audio or a video call via WebRTC
 * Receive system events and notifications and deliver necessary information to the customer
 * Send and Receive delivery notifications
 * Send and Receive all of the supported chat messages including rich-media messages
 * Enable call controls in the customer app for audio and video calls 
 * Get contact center stats `ROADMAP`
 * Contact center available timings `ROADMAP`
 * Get to know the availability of agents before initiating a request `ROADMAP`
 * Get to know expected waiting time `ROADMAP`
 
 ## Get Started
 
 ### Pre-requisites
 Make sure you have access to the Unified Admin Panel of the Expertflow CX. The following configurations are needs to be added in the Web Widget Setings.
 
 #### Widget Configurations for webRTC
 
 Properties | Explanation | Sample Value
--- | --- | ---
`wss_server_ip` | String value of EF switch IP or FQDN | wss_server_ip = *'192.168.1.201'*
`wss_server_port` | String value of EF switch webRTC port | wss_server_port = *'7443'*
`dialling_uri` | EF switch DN | dialling_uri = *'369852'*
`sip_extension` | Extension dedicated for dialling | sip_extension = *'ext'*
`extension_password` | Extension password for registration | extension_password = *'password'*
`websocket` | String value required to get web socket | websocket = *"ws"*
`iceServers` | Set of array values required to get servers | iceServers : [{ "urls": [ "stun:stun.l.google.com:19302" , "stun:stun1.l.google.com:19302" ] }]
`webhook_url` | String value required to get widget configurations | webhook_url = *"webhook notification url FQDN"*


### Update config file
Make sure to pass following configurations from config file to SDK

Properties | Explanation | Sample Value
--- | --- | ---
`widget_identifier` | String value required to get widget configurations | widget_identifier = *"Web"*
`service_identifier` | String value required to get channel manager details | service_identifier = *5155*
`channel` | String value required to check client device info | channel = *"Mobile"*
`socket_url` | String value of web channel manager IP or FQDN | socket_url = *"https://<public_ip>"*
`file_server_url` | String value of file server engine IP or FQDN | file_server_url = *"https://<public_ip>"*
`ccm_url` | String value of customer channel manager IP or FQDN | ccm_url = *"https://<public_ip>"*
`transcript_url` | String value of chat transcript IP or FQDN | transcript_url = *"https://<public_ip>"*

If Application is in React Native make sure to install additional packages to support SDK.
## Install Packages for React Native
Run the Following commands before installing React Native SDK for Customer Facing Channels:

* `npm i jssip-node-websocket`
* `npm i react-native-jssip`
* `npm i react-native-webrtc`
* `npm i websocket`

Once all these pre-requisite packages are installed, We're ready to install React Native SDK for Customer Facing Channels:
> npm i sdk-for-customer-facing-channels 

Now just include the SDK package into the file where SDK functions are required and experience the Expertflow CX Features.
> const customerSDK = require('sdk-for-customer-facing-channel');
