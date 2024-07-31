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
import { SocketConnection } from '@/utilities/socketConnection';
import { ref } from 'vue'

const video = ref<HTMLVideoElement | null>(null)
let mediaStream: MediaStream
const peerConnection = new RTCPeerConnection({});
const socketConnection = new SocketConnection("stream-video")

socketConnection.onmessage = e => {
  const info = JSON.parse(e.data)
  if (info.type === "icecandidate") {
    peerConnection?.addIceCandidate(info.candidate);
  } else if (info.type === "answer") {
    console.log("Received answer")
    peerConnection?.setRemoteDescription(info.answer);
  }
}

async function start() {
  if (!video.value) return
  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
  video.value.srcObject = mediaStream;
}

function stream () {
  peerConnection.addEventListener("icecandidate", e => {
    if (e.candidate !== null) {
      socketConnection.postMessage({ type: "icecandidate", candidate: e.candidate });
    }
  });

  if (!video.value) return

  mediaStream.getTracks()
    .forEach(track => peerConnection.addTrack(track, mediaStream));

  peerConnection.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
    .then(async offer => {
        await peerConnection.setLocalDescription(offer);
        socketConnection.postMessage({ type: "offer", offer })
        console.log("Created offer, sending...")
      })
}
</script>