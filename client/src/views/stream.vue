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
    <h3>People connected</h3>
    <section class="videos-remote">
      <video 
        ref="videoRemote" 
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { SocketConnection } from '@/utilities/socketConnection';
import { onMounted, ref } from 'vue'
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
  createOffer,
  handleAnswer,
  handleIceCandidate,
  handleOffer,
  createPeerConnection
} from '@/utilities/RTCSession'
const video = ref<HTMLVideoElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const videoRemote = ref<HTMLVideoElement | null>(null)

const hasToBlackAndWhite = ref(false)
const convolution = ref<'sober' | 'emboss' | 'sharpen' | 'blur' | undefined>(undefined)

const useWasm = ref(true)

let mediaStream: MediaStream
const socketConnection = new SocketConnection("stream-video")
let peerConnectionA: RTCPeerConnection
let peerConnectionB: RTCPeerConnection

socketConnection.onmessage = e => {
  const info = JSON.parse(e.data)
  if (info.type === "icecandidate") {
    handleIceCandidate(info.candidate, peerConnectionA)
  } else if (info.type === "answer") {
    handleAnswer(info.answer, peerConnectionA);
  } else if (info.type === 'offer') {
    handleOffer(info.offer, peerConnectionB, socketConnection)
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
    update();
  })

  function update() {
    if (video.value && canvas.value) {
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
    }

    setTimeout(update, 1000 / 30)
  }
}

async function stream () {
  mediaStream.getTracks()
    .forEach(track => peerConnectionA.addTrack(track, mediaStream));

  await createOffer(peerConnectionA, socketConnection)  

}

onMounted(async () => {
  await start()
  await socketConnection.init()

  if (videoRemote.value) {
    peerConnectionA = createPeerConnection(socketConnection, videoRemote.value)
    peerConnectionB = createPeerConnection(socketConnection, videoRemote.value)
  }

  stream()
})
</script>

<style lang="postcss">
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

  & video {
    width: 100%;
  }
}
</style>