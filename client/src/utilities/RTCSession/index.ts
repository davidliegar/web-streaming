import type { SocketConnection } from "../socketConnection";

const pendingCandidates: RTCIceCandidateInit[] = [];

export async function createOffer(peerConnection: RTCPeerConnection, socket: SocketConnection): Promise<void> {
  const offer = await peerConnection.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
  await peerConnection.setLocalDescription(offer);
  socket.postMessage({ type: "offer", offer })
  console.log("Created offer:", offer);
}

export async function handleOffer (offer: RTCSessionDescriptionInit, peerConnection: RTCPeerConnection, socket: SocketConnection) {
  await peerConnection.setRemoteDescription(offer)
  
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.postMessage({ type: 'answer', answer })
  console.log("Created answer:", answer);

  for (const candidate of pendingCandidates) {
    await handleIceCandidate(candidate, peerConnection);
  }

  pendingCandidates.length = 0;
}

export async function handleAnswer (answer: RTCSessionDescriptionInit, peerConnection: RTCPeerConnection): Promise<void> {
  await peerConnection.setRemoteDescription(answer);
}

export async function handleIceCandidate(candidate: RTCIceCandidateInit, peerConnection: RTCPeerConnection): Promise<void> {
  if (peerConnection.remoteDescription) {
    try {
      await peerConnection.addIceCandidate(candidate);
      console.log("Added ICE candidate:", candidate);
    } catch (error) {
      console.error("Error adding ICE candidate:", error);
    }
  } else {
    console.log("Remote description not set yet, storing candidate");
    pendingCandidates.push(candidate);
  }
}

export function createPeerConnection(socket: SocketConnection, index): RTCPeerConnection {
  let video:HTMLVideoElement
  
  const configuration: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" } // STUN server
    ]
  };

  const peerConnection = new RTCPeerConnection(configuration);

  peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
    if (event.candidate) {
      socket.postMessage({ type: "icecandidate", candidate: event.candidate });
    }
  };

  peerConnection.ontrack = (event: RTCTrackEvent) => {
    console.log('on-track', video)
    if (!video) {
      video = document.getElementById(`video-${index}`) as HTMLVideoElement | undefined
    }

    video.srcObject = event.streams[0]
    video.play()
  };

  peerConnection.oniceconnectionstatechange = () => {
    console.log("ICE connection state:", peerConnection.iceConnectionState);
  };

  return peerConnection;
}