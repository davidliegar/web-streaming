<template>
  <h3>Web streaming</h3>
  <form class="form">
    <h3>Apply Filters</h3>
    
    <label class="tool">
      Apply B&W
      <input 
        type="checkbox" 
        v-model="hasToBlackAndWhite"
      >
    </label>

    <h3>Apply convolution matrix</h3>
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


  <section class="video">
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

    <!-- <button @click="stream">stream video</button> -->
  </section>
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

const video = ref<HTMLVideoElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)

const hasToBlackAndWhite = ref(false)
const convolution = ref<'sober' | 'emboss' | 'sharpen' | 'blur' | undefined>(undefined)

const useWasm = ref(true)

let mediaStream: MediaStream
// const peerConnection = new RTCPeerConnection({});
// const socketConnection = new SocketConnection("stream-video")

// socketConnection.onmessage = e => {
//   const info = JSON.parse(e.data)
//   if (info.type === "icecandidate") {
//     peerConnection?.addIceCandidate(info.candidate);
//   } else if (info.type === "answer") {
//     console.log("Received answer")
//     peerConnection?.setRemoteDescription(info.answer);
//   }
// }

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

        applyConvolutionMatrix(canvas.value, convolutionToApply, useWasm.value)
      }
    }

    setTimeout(update, 1000 / 30)
  }
}

// function stream () {
//   peerConnection.addEventListener("icecandidate", e => {
//     if (e.candidate !== null) {
//       socketConnection.postMessage({ type: "icecandidate", candidate: e.candidate });
//     }
//   });

//   if (!video.value) return

//   mediaStream.getTracks()
//     .forEach(track => peerConnection.addTrack(track, mediaStream));

//   peerConnection.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
//     .then(async offer => {
//         await peerConnection.setLocalDescription(offer);
//         socketConnection.postMessage({ type: "offer", offer })
//         console.log("Created offer, sending...")
//       })
// }


onMounted(() => {
  start()
})
</script>

<style lang="postcss">
.tool {
  display: block;
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
</style>