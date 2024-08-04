
import { ulid} from 'ulid'
export class SocketConnection {
  socket: WebSocket
  channel: string
  id: string = ulid()

  constructor(channel: string) {    
    this.socket = new WebSocket('wss://ylqihexi6d.execute-api.eu-west-2.amazonaws.com/production/');
    this.channel = channel
  }

  async init() {
    return new Promise((resolve) => {
      this.socket.addEventListener("message", (e) => {
        const object = JSON.parse(e.data || '{}');
        this.onmessage(object);
      })

      this.socket.addEventListener("open", () => {
        console.log('socket opened')
        this.postMessage({ type: "join-channel", channel: this.channel });
        resolve(true)
      })
  
      if (this.socket.readyState == WebSocket.OPEN ) {
        this.postMessage({ type: "join-channel", channel: this.channel });
        resolve(true)
      }
    })
  }
  
  onmessage(message: Record<string, any>) {
  }

  postMessage(data: Record<string, unknown>) {
    this.socket.send(JSON.stringify({ ...data, senderId: this.id }) );
  }
}