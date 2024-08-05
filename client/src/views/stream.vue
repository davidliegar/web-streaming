<template>
  <header class="header">
    <h1>Web streaming</h1>
  </header>
    <div class="local-video">
      <form class="form">
        <h4>Apply Filters</h4>
        
        <label class="tool">
          Apply B&W
          <input 
            type="checkbox" 
            v-model="hasToBlackAndWhite"
          >
        </label>
    
        <h4>Apply convolution matrix</h4>
        <label class="tool">
          Use Wasm algorithm (made with rust, better performance), 
          <input 
            type="checkbox" 
            v-model="useWasm"
          >
        </label>
    
        <label class="tool">
          None
          <input 
            type="radio" 
            value="undefined"
            v-model="convolution"
          >
        </label>
    
        <label class="tool">
          Apply Sobel (Edge detection)
          <input 
            type="radio" 
            value=sober
            v-model="convolution"
          >
        </label>
    
        <label class="tool">
          Emboss
          <input 
            type="radio" 
            value=emboss
            v-model="convolution"
          >
        </label>
    
        <label class="tool">
          Sharpen
          <input 
            type="radio" 
            value=sharpen
            v-model="convolution"
          >
        </label>
    
        <label class="tool">
          Blur
          <input 
            type="radio" 
            value=blur
            v-model="convolution"
          >
        </label>
      </form>
    
      <section class="video-wrapper">
        <video 
         ref="video" 
         class="video"
         autoplay 
         muted
        />
    
        <canvas 
          ref="canvas" 
          class="canvas"
        />
      </section>
    </div>
    <div class="width-constrain">
    <h3>{{ totalPeers }} people connected</h3>
    <section class="videos-remote">
      <video
        v-for="(peer) in peerConnections.filter(peer => peer.id !== myId)"
        :id="`video-${peer.id}`"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { SocketConnection } from '@/utilities/socketConnection';
import { onMounted, ref, watch, watchEffect, type Ref } from 'vue'
import {
  toBlackAndWhite,
  drawVideoIntoCanvasFullWidth,
  applyConvolutionMatrix,
  SOBER_HORIZONTAL,
  SOBER_VERTICAL,
  EMBOSS,
  SHARPEN,
  GAUSSIAN_BLUR
} from '@/utilities/canvas'

import {
  peerConnections,
  createOffer,
  handleAnswer,
  handleIceCandidate,
  handleOffer,
  createPeerConnection,
} from '@/utilities/RTCSession'
const video = ref<HTMLVideoElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)

const hasToBlackAndWhite = ref(false)
const convolution = ref<'sober' | 'emboss' | 'sharpen' | 'blur' | undefined>(undefined)

const useWasm = ref(true)

let mediaStream: MediaStream
const socketConnection = new SocketConnection('stream-video')
let totalPeers = ref(0)
let myId = ref('')

socketConnection.onmessage = async (info) => {
  totalPeers.value = info.total
  const { type, senderId, targetId, offer, answer, candidate } = info;
  console.log('2', type, { targetId, senderId, myId: myId.value })
  
  if (targetId && targetId !== myId.value) {
    if (type === 'existing-user') {
      console.log('ha llegado', senderId)
      await connectToExistingUser(senderId);
    }
  } else if (type === 'join-channel') {
    await connectToExistingUser(senderId);
    await createOffer(myId.value, socketConnection)  

    socketConnection.postMessage({ type: "existing-user", targetId: myId.value }) 
  } else if (type === 'icecandidate') {
    await handleIceCandidate(candidate, senderId)
  } else if (type === 'offer') {
    await handleOffer(offer, senderId, socketConnection, mediaStream)
  } else if (type === 'answer') {
    await handleAnswer(answer, senderId);
  } 
}

async function start () {
  if (!video.value || !canvas.value) return
  let videoMediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
  video.value.srcObject = videoMediaStream;

  mediaStream = canvas.value.captureStream(30);

  canvas.value.width = 500 * window.devicePixelRatio
  canvas.value.height = 500 * window.devicePixelRatio

  canvas.value.style.width = `${500}px`
  canvas.value.style.height = `${500}px`


  video.value.addEventListener('loadeddata', function() {
    update(0);
  })

  let previousDelta = 0
  const fpsLimit = 30

  function update(currentDelta: number) {
    if (video.value && canvas.value) {
      requestAnimationFrame(update);

      var delta = currentDelta - previousDelta;

      if (fpsLimit && delta < 1000 / fpsLimit) {
        return;
      }

      drawVideoIntoCanvasFullWidth(canvas.value, video.value)

      hasToBlackAndWhite.value && toBlackAndWhite(canvas.value)

      if (convolution.value) {
        const convolutionToApply = {
          sober: [SOBER_VERTICAL, SOBER_HORIZONTAL],
          emboss: [EMBOSS],
          sharpen: [SHARPEN],
          blur: [GAUSSIAN_BLUR]
        }[convolution.value]

        if (convolutionToApply) {
          applyConvolutionMatrix(canvas.value, convolutionToApply, useWasm.value)
        }
      }

      previousDelta = currentDelta;
    }
  }
}

async function connectToExistingUser(userId: string) {
  createPeerConnection(socketConnection, userId, mediaStream);
  await createOffer(userId, socketConnection);
}

onMounted(async () => {
  await start()
  await socketConnection.init()
  myId.value = socketConnection.id
})
</script>

<style lang="postcss" scoped>
.header {
  background: #2f2d9e;
  color: white;
  font-weight: 700;
  font-size: 2rem;
  padding: 0 1rem;

  & h1 {
    margin: 0;
  }
}

.tool {
  display: block;
}

.local-video {
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 1rem 3rem;
  background-color: #f3f2f2;
}

.form {
  display: grid;
  gap: 16px;
}

.form__same-line {
  display: flex;
  gap: 8px;
}

.video {
  width: 0px;
  height: 0px;
  position: absolute;
}

.width-constrain {
  padding: 1rem 3rem;
}

.videos-remote {
  display: grid;
  grid-auto-columns: 500px;
  grid-auto-flow: column;
  gap: 24px;

  & video {
    width: 100%;
  }
}
</style>