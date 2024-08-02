<template>
  <section class="video">
    <video 
      ref="videoRemote" 
     controls 
    />
  </section>
</template>

<script setup lang="ts">
import { SocketConnection } from '@/utilities/socketConnection'
import { ref } from 'vue'

const videoRemote = ref<HTMLVideoElement | null>(null)

const peerConnection = new RTCPeerConnection({});
const socketConnection = new SocketConnection('stream-video')
socketConnection.onmessage = e => {
  const info = JSON.parse(e.data)
  if (info.type === 'icecandidate') {
    peerConnection.addIceCandidate(info.candidate)
  } else if (info.type === 'offer') {
    handleOffer(info.offer)
  }
}

function handleOffer (offer: RTCSessionDescriptionInit) {
  peerConnection.addEventListener('track', e => {
    if (!videoRemote.value) return
    console.log('tracking')
    videoRemote.value.srcObject = e.streams[0]
  })

  peerConnection.addEventListener('icecandidate', e => {
    if (e.candidate !== null) {

      socketConnection.postMessage({ type: 'icecandidate', candidate: e.candidate })
    }
  });

  peerConnection.setRemoteDescription(offer)
    .then(() => peerConnection.createAnswer())
    .then(async answer => {
        await peerConnection.setLocalDescription(answer);
        console.log('Created answer, sending...')
        socketConnection.postMessage({ type: 'answer', answer })
      });
}
</script>