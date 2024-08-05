import { ref, type Ref } from "vue";
import type { SocketConnection } from "../socketConnection";

export interface PeerConnection {
  id: string,
  connection: RTCPeerConnection
}
interface PendingCandidates {
  id: string,
  candidate: RTCIceCandidateInit
}

const pendingCandidates: PendingCandidates[] = [];
export const peerConnections: Ref<PeerConnection[]> = ref([]);

export async function createOffer(id: string, socket: SocketConnection): Promise<void> {
  const peerConnection = peerConnections.value.find(p => p.id === id)?.connection;

  if (!peerConnection) {
    console.error(`No peer connection found for id ${id}`);
    return;
  }
  
  const offer = await peerConnection.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
  await peerConnection.setLocalDescription(offer);
  socket.postMessage({ type: "offer", offer, targetId: id })
  console.log("Created offer:", offer);
}

export async function handleOffer(offer: RTCSessionDescriptionInit, senderId: string, socket: SocketConnection, media: MediaStream) {
  let peerConnection = peerConnections.value.find(p => p.id === senderId)?.connection;
  if (!peerConnection) {
    peerConnection = createPeerConnection(socket, senderId, media);
  }

  await peerConnection.setRemoteDescription(offer)
  
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.postMessage({ type: 'answer', answer, targetId: senderId })
  console.log("Created answer:", answer);

  for (const candidate of pendingCandidates) {
    await handleIceCandidate(candidate.candidate, candidate.id);
  }

  pendingCandidates.length = 0;
}

export async function handleAnswer (answer: RTCSessionDescriptionInit, id: string): Promise<void> {
  const peerConnection = peerConnections.value.find(p => p.id === id)?.connection;

  if (!peerConnection) {
      console.error(`No peer connection found for id ${id}`);
      return;
  }

  if (peerConnection.signalingState === "have-local-offer") {
    await peerConnection.setRemoteDescription(answer);
    console.log(`Set remote description for peer ${id} with answer`, answer);
  } else {
    console.error(`Unexpected signaling state ${peerConnection.signalingState} for peer ${id}`);
  }
}

export async function handleIceCandidate(candidate: RTCIceCandidateInit, id: string): Promise<void> {
  const peerConnection = peerConnections.value.find(p => p.id === id)?.connection;

  if (!peerConnection) {
    pendingCandidates.push({ id, candidate });
    return;
  }
  
  if (peerConnection.remoteDescription) {
    try {
      await peerConnection.addIceCandidate(candidate);
      console.log("Added ICE candidate:", candidate);
    } catch (error) {
      console.error("Error adding ICE candidate:", error);
    }
  } else {
    console.log("Remote description not set yet, storing candidate");
    pendingCandidates.push({ id, candidate });
  }
}

export function createPeerConnection(socket: SocketConnection, id: string, media: MediaStream): RTCPeerConnection {
  let video:HTMLVideoElement | undefined
  
  const configuration: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" } // STUN server
    ]
  };

  const peerConnection = new RTCPeerConnection(configuration);

  peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
    if (event.candidate) {
      socket.postMessage({ type: "icecandidate", candidate: event.candidate, targetId: id, });
    }
  };

  peerConnection.ontrack = (event: RTCTrackEvent) => {
    console.log('on-track', video, `video-${id}`)
    if (!video) {
      video = document.getElementById(`video-${id}`) as HTMLVideoElement | undefined
    }
    console.log('on-track 2', video, `video-${id}`)
    if (video) {
      video.srcObject = event.streams[0]
      video.play()
    }
  };

  peerConnection.oniceconnectionstatechange = () => {
    console.log("ICE connection state:", peerConnection.iceConnectionState);
  };

  media.getTracks()
    .forEach(track =>peerConnection.addTrack(track, media));

  peerConnections.value.push({ id, connection: peerConnection });

  return peerConnection;
}

export function sendMessageToAllPeers () {
  peerConnections.value.forEach((peer) => {
    const dataChannel = peer.connection.createDataChannel('chat');
    dataChannel.onopen = () => {
      dataChannel.send('Hello from Vue!');
      console.log(`Message sent to peer ${peer.id}`);
    };
  });
}