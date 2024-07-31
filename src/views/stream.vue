<template>
  <section class="video">
    <video 
     ref="video" 
     autoplay 
     muted
    />

    <button @click="start">start video</button>
    <button @click="stream">stream video</button>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

const video = ref<HTMLVideoElement | null>(null)
let mediaStream: MediaStream
let peerConnection: RTCPeerConnection

const channel = new BroadcastChannel("stream-video");
channel.onmessage = e => {
  if (e.data.type === "icecandidate") {
    peerConnection?.addIceCandidate(e.data.candidate);
  } else if (e.data.type === "answer") {
    console.log("Received answer")
    peerConnection?.setRemoteDescription(e.data);
  }
}

async function start() {
  if (!video.value) return
  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
  video.value.srcObject = mediaStream;
}

function stream () {
  const config = {};
  const peerConnection = new RTCPeerConnection(config);

  peerConnection.addEventListener("icecandidate", e => {
    if (e.candidate !== null) {
      let candidate = {
        candidate: e.candidate.candidate,
        sdpMid: e.candidate.sdpMid,
        sdpMLineIndex: e.candidate.sdpMLineIndex,
      }

      channel.postMessage({ type: "icecandidate", candidate });
    }
  });

  if (!video.value) return

  mediaStream.getTracks()
    .forEach(track => peerConnection.addTrack(track, mediaStream));

  peerConnection.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
    .then(async offer => {
        await peerConnection.setLocalDescription(offer);
        channel.postMessage({ type: "offer", sdp: offer.sdp });
        console.log("Created offer, sending...");
      })
}
// async function stream() {
//   const channel = new SocketConnection("stream-video");    
//   channel.onmessage = e => {
//     if (e.data.type === "icecandidate") {
//       peerConnection?.addIceCandidate(e.data.candidate);
//     } else if (e.data.type === "answer") {
//       console.log("Received answer");
//       peerConnection?.setRemoteDescription(e.data);
//     }
//   }
//   const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })

//   if (video.value) {
//     video.value.srcObject = stream
//   }

//   const peerConnection = new RTCPeerConnection({})

//   peerConnection.addEventListener("icecandidate", e => {
//     let candidate = null;

//     if (e.candidate !== null) {
//       candidate = {
//         candidate: e.candidate.candidate,
//         sdpMid: e.candidate.sdpMid,
//         sdpMLineIndex: e.candidate.sdpMLineIndex,
//       };
//     }

//     channel.postMessage({ type: "icecandidate", candidate });
//   })

//   stream.getTracks()
//     .forEach(track => peerConnection.addTrack(track, stream));

//   const offer = await peerConnection.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
//   await peerConnection.setLocalDescription(offer);
//   console.log("Created offer, sending...");
//   channel.postMessage({ type: "offer", sdp: offer.sdp });
// }

// async function readStream() {
//   let peerConnection;

//   const channel = new SocketConnection("stream-video");
//   channel.onmessage = e => {
//     if (e.data.type === "icecandidate") {
//       peerConnection?.addIceCandidate(e.data.candidate);
//     } else if (e.data.type === "offer") {
//       console.log("Received offer");
//       handleOffer(e.data);
//     }
//   }

//   function handleOffer(offer) {
//     const config = {};
//     peerConnection = new RTCPeerConnection(config);
//     peerConnection.addEventListener("track", e => remote.srcObject = e.streams[0]);
//     peerConnection.addEventListener("icecandidate", e => {
//       let candidate = null;
//       if (e.candidate !== null) {
//         candidate = {
//           candidate: e.candidate.candidate,
//           sdpMid: e.candidate.sdpMid,
//           sdpMLineIndex: e.candidate.sdpMLineIndex,
//         };
//       }
//       channel.postMessage({ type: "icecandidate", candidate });
//     });
//     peerConnection.setRemoteDescription(offer)
//       .then(() => peerConnection.createAnswer())
//       .then(async answer => {
//         await peerConnection.setLocalDescription(answer);
//         console.log("Created answer, sending...");
//         channel.postMessage({
//           type: "answer",
//           sdp: answer.sdp,
//         });
//       });
//   }
// }
// onMounted(async () => {
//   stream()
//   readStream()
// })
</script>

<style scoped>

</style>
