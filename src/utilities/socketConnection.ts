export class SocketConnection {
  socket: WebSocket
  
  constructor(channel: string) {    
    this.socket = new WebSocket('wss://ylqihexi6d.execute-api.eu-west-2.amazonaws.com/production/');
    this.socket.addEventListener("open", () => {
      this.postMessage({ type: "join-channel", channel });
    })

    this.socket.addEventListener("message", (e) => {
      console.log(e)
      const object = JSON.parse(e.data || '{}');
      this.onmessage({ data: object });
    });
  }
  
  onmessage(message: { data: Record<string, string> }) {}
  postMessage(data: Record<string, unknown>) {
    this.socket.send(JSON.stringify(data) );
  }
}