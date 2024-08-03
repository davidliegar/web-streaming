
export class SocketConnection {
  socket: WebSocket
  channel: string

  constructor(channel: string) {    
    this.socket = new WebSocket('wss://ylqihexi6d.execute-api.eu-west-2.amazonaws.com/production/');
    this.channel = channel
  }

  async init() {
    return new Promise((resolve) => {
      this.socket.addEventListener("message", (e) => {
        const object = JSON.parse(e.data || '{}');
        this.onmessage({ data: object });
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
  
  onmessage(message: { data: string }) {
  }

  postMessage(data: Record<string, unknown>) {
    this.socket.send(JSON.stringify(data) );
  }
}